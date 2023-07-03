import {
    Response,
    type LoaderArgs,
    type V2_MetaFunction,
    json,
} from "@remix-run/node";
import { db } from "../lib/db";
import { useDoc, useFind } from "use-pouchdb";
import { useLoaderData, useParams } from "@remix-run/react";
import { DBTypes, DatasetObject } from "../lib/types";
import { getIntegrationForDataset } from "../lib/integrations";

const LIMIT = 1;

export const meta: V2_MetaFunction<typeof loader> = (args) => {
    const obj = args.data?.initialObjectDefinitionValue;
    return [{ title: obj?.name ? obj.name : "Mainframe" }];
};

export async function loader({ params }: LoaderArgs) {
    const datasetId = params.id;
    const objectId = params.object_id;
    if (!datasetId) {
        throw new Response("Missing dataset ID", { status: 404 });
    }
    if (!objectId) {
        throw new Response("Missing objects ID", { status: 404 });
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

        const objectEntry = Object.entries(integration.objects ?? {}).find(
            ([id]) => id.toLowerCase() === objectId.toLowerCase(),
        );

        if (!objectEntry) {
            throw new Response("Object not found", { status: 404 });
        }

        const objectDefinition = objectEntry[1];

        const rows = (await db.find({
            selector: {
                type: "object",
                objectType: objectEntry[0],
                datasetId: dataset._id,
            },
            limit: LIMIT,
        })) as PouchDB.Find.FindResponse<DatasetObject>;

        return json({
            initialDatasetValue: dataset,
            initialObjectDefinitionValue: objectDefinition,
            initialObjectDataValue: rows.docs.at(0),
        });
    } catch (e: any) {
        // TODO: Better handle PouchDB error
        if (e.error === "not_found") {
            // It might not have synced yet
            return json({
                initialDatasetValue: null,
                initialObjectDefinitionValue: null,
                initialObjectDataValue: null,
            });
        }
        console.error(e);
        throw new Response(null, { status: 500 });
    }
}

export default function DatasetObjectDetails() {
    const {
        initialDatasetValue,
        initialObjectDefinitionValue,
        initialObjectDataValue,
    } = useLoaderData<typeof loader>();
    const { id, object_id } = useParams();
    const { doc, error } = useDoc<DBTypes>(
        id ?? "",
        {},
        initialDatasetValue ?? undefined,
    );

    const { docs, loading: objectLoading } = useFind<DatasetObject>({
        selector: {
            type: "object",
            objectType: object_id,
            datasetId: id,
        },
        limit: LIMIT,
    });
    const dataset = doc ?? initialDatasetValue;
    const objectData = objectLoading ? initialObjectDataValue : docs.at(0);

    // Early return

    if (!dataset || error || dataset.type !== "dataset") {
        // TODO: If we get an error, we might want to throw
        console.log("useDoc error", error);
        // TODO: Loading UI if we need to
        return null;
    }

    return (
        <div className="flex flex-col relative max-h-screen overflow-y-auto">
            <div className="flex flex-col gap-8 items-start">
                <h1 className="text-2xl m-4 font-medium">{dataset?.name}</h1>
                <div className="">
                    <pre className="whitespace-pre-wrap font-mono p-4">
                        {JSON.stringify(objectData?.data, null, 4)}
                    </pre>
                </div>
            </div>
        </div>
    );
}
