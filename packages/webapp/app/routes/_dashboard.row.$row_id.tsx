import { useDoc } from "use-pouchdb";
import { useParams } from "@remix-run/react";
import { DBTypes } from "../lib/types";

export default function DatasetRowDetails() {
    const { row_id } = useParams();
    const { doc, error } = useDoc<DBTypes>(row_id ?? "", {});

    // Early return

    if (!doc || error || doc.type !== "row") {
        console.log("useDoc error", error);
        return null;
    }

    return (
        <div className="flex flex-col relative max-h-screen overflow-y-auto">
            <div className="flex flex-col gap-8 items-start">
                <div className="">
                    <pre className="whitespace-pre-wrap font-mono p-4">
                        {JSON.stringify(doc.data, null, 4)}
                    </pre>
                </div>
            </div>
        </div>
    );
}
