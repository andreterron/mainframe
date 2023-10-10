import { useParams } from "react-router-dom";
import { trpc } from "../lib/trpc_client";

export default function DatasetObjectDetails() {
    const { id: datasetId, object_id: objectId } = useParams();

    const { data, error } = trpc.getObjectAndDataset.useQuery({
        datasetId,
        objectId,
    });

    if (!data) {
        // TODO: Loading/Error/Not found
        return null;
    }

    const { dataset, object: objectData } = data;

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
