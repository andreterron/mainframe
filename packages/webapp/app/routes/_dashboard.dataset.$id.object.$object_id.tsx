import { useLoaderData } from "@remix-run/react";
import { LoaderArgs, json } from "@remix-run/node";
import { datasetsTable, objectsTable } from "../db/schema";
import { db } from "../db/db.server";
import { and, eq } from "drizzle-orm";
import { syncObject } from "../../server/sync";
import { getDatasetObject } from "../lib/integrations";
import { deserializeData } from "../utils/serialization";
import { notFound } from "remix-utils";

export async function loader({ params }: LoaderArgs) {
    const datasetId = params.id;
    const objectId = params.object_id;

    if (!datasetId || !objectId) {
        throw notFound({});
    }

    let [[dataset], [object]] = await Promise.all([
        db
            .select()
            .from(datasetsTable)
            .where(eq(datasetsTable.id, datasetId))
            .limit(1),
        db
            .select()
            .from(objectsTable)
            .where(
                and(
                    eq(objectsTable.objectType, objectId),
                    eq(objectsTable.datasetId, datasetId),
                ),
            )
            .limit(1),
    ]);

    const objectDefinition = getDatasetObject(dataset, objectId);

    const syncPromise = objectDefinition
        ? syncObject(dataset, objectDefinition)
        : null;

    if (!object) {
        await syncPromise;

        [object] = await db
            .select()
            .from(objectsTable)
            .where(
                and(
                    eq(objectsTable.objectType, objectId),
                    eq(objectsTable.datasetId, datasetId),
                ),
            )
            .limit(1);
    }

    if (!object) {
        throw notFound({});
    }

    return json({
        object: deserializeData(object),
        dataset,
    });
}

export default function DatasetObjectDetails() {
    const { dataset, object: objectData } = useLoaderData<typeof loader>();

    return (
        <div className="flex flex-col relative max-h-screen overflow-y-auto">
            <div className="flex flex-col gap-8 items-start">
                <h1 className="text-2xl m-4 font-medium">{dataset.name}</h1>
                <div className="">
                    <pre className="whitespace-pre-wrap font-mono p-4">
                        {JSON.stringify(objectData.data, null, 4)}
                    </pre>
                </div>
            </div>
        </div>
    );
}
