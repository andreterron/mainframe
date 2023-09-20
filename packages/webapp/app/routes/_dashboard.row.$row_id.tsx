import { useLoaderData } from "@remix-run/react";
import { db } from "../db/db.server";
import { rowsTable } from "../db/schema";
import { LoaderArgs, json } from "@remix-run/node";
import { eq } from "drizzle-orm";
import { deserialize } from "../utils/serialization";
import { notFound } from "remix-utils";

export async function loader({ params }: LoaderArgs) {
    const rowId = params.row_id;
    if (!rowId) {
        throw notFound({});
    }
    const [row] = await db
        .select({ data: rowsTable.data })
        .from(rowsTable)
        .where(eq(rowsTable.id, rowId))
        .limit(1);
    if (!row) {
        throw notFound({});
    }
    return json({ data: deserialize(row.data) });
}

export default function DatasetRowDetails() {
    const { data } = useLoaderData<typeof loader>();

    return (
        <div className="flex flex-col relative max-h-screen overflow-y-auto">
            <div className="flex flex-col gap-8 items-start">
                <div className="">
                    <pre className="whitespace-pre-wrap font-mono p-4">
                        {data === undefined
                            ? "undefined"
                            : JSON.stringify(data, null, 4)}
                    </pre>
                </div>
            </div>
        </div>
    );
}
