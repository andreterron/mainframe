import {
    Response,
    type LoaderArgs,
    type V2_MetaFunction,
    json,
} from "@remix-run/node";
import { db } from "../lib/db";
import { useDoc, useFind } from "use-pouchdb";
import { useLoaderData, useParams } from "@remix-run/react";
import { DBTypes, Row } from "../lib/types";
import { getIntegrationForDataset } from "../lib/integrations";
import { useMemo } from "react";

const LIMIT = 50;

export const meta: V2_MetaFunction<typeof loader> = (args) => {
    const table = args.data?.initialTableValue;
    return [{ title: table?.name ? table.name : "Mainframe" }];
};

export async function loader({ params }: LoaderArgs) {
    const datasetId = params.id;
    const tableId = params.table_id;
    if (!datasetId) {
        throw new Response("Missing dataset ID", { status: 404 });
    }
    if (!tableId) {
        throw new Response("Missing table ID", { status: 404 });
    }
    try {
        const dataset = await db.get(datasetId);

        if (dataset.type !== "dataset") {
            throw new Response("Not Found", { status: 404 });
        }

        const integration = getIntegrationForDataset(dataset);

        if (!integration) {
            throw new Response("Missing integration", { status: 404 });
        }

        const tableEntry = Object.entries(integration.tables).find(
            ([id]) => id.toLowerCase() === tableId.toLowerCase(),
        );

        if (!tableEntry) {
            throw new Response("Table not found", { status: 404 });
        }

        const table = tableEntry[1];

        const rows = (await db.find({
            selector: {
                type: "row",
                table: tableEntry[0],
                datasetId: dataset._id,
            },
            limit: LIMIT,
        })) as PouchDB.Find.FindResponse<Row>;

        return json({
            initialDatasetValue: dataset,
            initialTableValue: table,
            initialRowsValue: rows.docs,
        });
    } catch (e: any) {
        // TODO: Better handle PouchDB error
        if (e.error === "not_found") {
            // It might not have synced yet
            return json({
                initialDatasetValue: null,
                initialTableValue: null,
                initialRowsValue: null,
            });
        }
        console.error(e);
        throw new Response(null, { status: 500 });
    }
}

export default function DatasetTableDetails() {
    const { initialDatasetValue, initialRowsValue } =
        useLoaderData<typeof loader>();
    const { id, table_id } = useParams();
    const { doc, error } = useDoc<DBTypes>(
        id ?? "",
        {},
        initialDatasetValue ?? undefined,
    );
    const { docs, loading: rowsLoading } = useFind<Row>({
        selector: {
            type: "row",
            table: table_id,
            datasetId: id,
        },
        limit: LIMIT,
    });
    const dataset = doc ?? initialDatasetValue;
    const rows = rowsLoading ? initialRowsValue : docs;

    let columns = useMemo(() => {
        const columnsSet = new Set<string>();
        rows?.forEach((row) =>
            Object.keys(row.data).forEach((key) => columnsSet.add(key)),
        );
        return [...columnsSet];
    }, [rows]);

    // Early return

    if (!dataset || error || dataset.type !== "dataset") {
        // TODO: If we get an error, we might want to throw
        console.log("useDoc error", error);
        // TODO: Loading UI if we need to
        return null;
    }

    return (
        <div className="flex flex-col relative max-h-screen overflow-y-auto">
            {/* TODO: Header */}
            <div className="flex flex-col gap-8 items-start">
                <h1 className="text-2xl m-4 font-medium">{dataset?.name}</h1>
                <div></div>
                <div className="">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 border-separate border-spacing-0 border-t">
                        <thead className="text-xs text-gray-700 uppercase ">
                            <tr className="">
                                {columns.map((col) => (
                                    <th
                                        key={col}
                                        scope="col"
                                        className="box-border border-b bg-gray-50 dark:bg-gray-700 dark:text-gray-400 px-6 py-3 sticky top-0"
                                    >
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows?.map((row) => (
                                <tr
                                    key={row._id}
                                    className="bg-white dark:bg-gray-800 dark:border-gray-700"
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={col}
                                            className="px-6 py-4 border-b font-mono whitespace-nowrap"
                                        >
                                            {row.data[col] !== undefined
                                                ? JSON.stringify(row.data[col])
                                                : ""}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
