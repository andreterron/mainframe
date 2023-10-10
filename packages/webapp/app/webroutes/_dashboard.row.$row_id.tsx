import { useParams } from "react-router-dom";
import { trpc } from "../lib/trpc_client";

export default function DatasetRowDetails() {
    const { row_id: rowId } = useParams();
    const { data: row } = trpc.getRow.useQuery({ rowId });

    if (!row) {
        // TODO: Loading / Not Found / Error
        return null;
    }

    return (
        <div className="flex flex-col relative max-h-screen overflow-y-auto">
            <div className="flex flex-col gap-8 items-start">
                <div className="">
                    <pre className="whitespace-pre-wrap font-mono p-4">
                        {row.data === undefined
                            ? "undefined"
                            : JSON.stringify(row.data, null, 4)}
                    </pre>
                </div>
            </div>
        </div>
    );
}
