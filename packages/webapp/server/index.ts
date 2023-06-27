import cron from "node-cron";
import closeWithGrace from "close-with-grace";
import { db } from "../app/lib/db";
import { getTablesForDataset } from "../app/lib/integrations";
import { Dataset } from "../app/lib/types";
import { isEqual } from "lodash";

console.log("Server is up!");

async function createIndexes() {
    db.createIndex({
        index: {
            fields: ["type"],
        },
    });
    db.createIndex({
        index: {
            fields: ["type", "datasetId", "table"],
        },
    });
}

createIndexes().catch((e) => console.error(e));

// Create cron
const task = cron.schedule(
    "*/10 * * * *",
    async (now) => {
        // TODO: Ensure index exists

        // Load all datasets
        const datasets = (await db.find({
            selector: {
                type: "dataset",
            },
        })) as PouchDB.Find.FindResponse<Dataset>;

        if (datasets.warning) {
            console.warn(datasets.warning);
        }

        for (let dataset of datasets.docs) {
            if (!dataset.integrationType || !dataset.oakToken) {
                continue;
            }

            // Load all tables
            const tables = getTablesForDataset(dataset);

            for (let table of tables) {
                if (!table.get || !table.rowId) {
                    continue;
                }

                console.log(
                    `Loading data for table ${table.name} from ${dataset.name}`,
                );

                // Call fetch on each table
                const data = await table.get(dataset);

                // Save the rows on the DB
                if (!Array.isArray(data)) {
                    continue;
                }

                let updated = 0;

                for (let rowData of data) {
                    const id = table.rowId(dataset, rowData);

                    try {
                        const row = await db.get(id);

                        if (
                            row.type === "row" &&
                            isEqual(row.data, rowData) &&
                            row.datasetId
                        ) {
                            continue;
                        }

                        updated++;

                        await db.put({
                            ...row,
                            data: rowData,
                            datasetId: dataset._id,
                        });
                    } catch (e: any) {
                        if (e.error === "not_found") {
                            updated++;
                            await db.put({
                                _id: id,
                                type: "row",
                                data: rowData,
                                table: table.id,
                                datasetId: dataset._id,
                            });
                        }
                    }
                }

                console.log(`Updated ${updated} rows`);
            }
        }
    },
    {
        runOnInit: true,
    },
);

closeWithGrace(() => {
    task.stop();
});
