import { useDoc, useFind } from "use-pouchdb";
import { useParams } from "@remix-run/react";
import { DBTypes, DatasetObject } from "../lib/types";
import { LoaderArgs, json } from "@remix-run/node";
import { apiBaseUrl } from "../lib/url";

const LIMIT = 1;

export async function loader({ params }: LoaderArgs) {
    const datasetId = params.id;
    const objectId = params.object_id;
    if (datasetId && objectId) {
        // Trigger sync of this object
        void fetch(
            `${apiBaseUrl}/sync/dataset/${datasetId}/object/${objectId}`,
            {
                method: "POST",
            },
        ).catch((e) => console.error(e));
    }
    return json({});
}

export default function DatasetObjectDetails() {
    const { id, object_id } = useParams();
    const { doc, error } = useDoc<DBTypes>(id ?? "", {}, undefined);

    const { docs, loading: objectLoading } = useFind<DatasetObject>({
        selector: {
            type: "object",
            objectType: object_id,
            datasetId: id,
        },
        limit: LIMIT,
    });
    const dataset = doc;
    const objectData = objectLoading ? undefined : docs.at(0);

    // Early return

    if (!dataset || !objectData || error || dataset.type !== "dataset") {
        // TODO: If we get an error, we might want to throw
        if (error) console.log("useDoc error", error);
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
