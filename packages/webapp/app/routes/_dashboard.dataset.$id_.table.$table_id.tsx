import {
    Response,
    type LoaderArgs,
    type V2_MetaFunction,
    json,
} from "@remix-run/node";
import { db } from "../lib/db";
import { useDoc } from "use-pouchdb";
import { useLoaderData, useParams } from "@remix-run/react";
import { DBTypes } from "../lib/types";
import { getIntegrationForDataset } from "../lib/integrations";

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

        let data: any;
        if (table.get) {
            data = await table.get(dataset);
        }

        // const table = await db.get(tableId);
        return json({
            initialDatasetValue: dataset,
            initialTableValue: table,
            data,
        });
    } catch (e: any) {
        // TODO: Better handle PouchDB error
        if (e.error === "not_found") {
            throw new Response("Not Found", { status: 404 });
        }
        console.error(e);
        throw new Response(null, { status: 500 });
    }
}

export default function DatasetTableDetails() {
    const { initialDatasetValue, data } = useLoaderData<typeof loader>();
    const { id } = useParams();
    const { doc, error } = useDoc<DBTypes>(id ?? "", {}, initialDatasetValue);
    const dataset = doc ?? initialDatasetValue;

    // Functions

    // Early return

    if (!dataset || error || dataset.type !== "dataset") {
        // TODO: If we get an error, we might want to throw
        console.log("useDoc error", error);
        // TODO: Loading UI if we need to
        return null;
    }

    return (
        <div className="flex flex-col">
            {/* TODO: Header */}
            <div className="flex flex-col gap-8 items-start">
                <h1 className="text-2xl m-4 font-medium">{dataset?.name}</h1>
                <div></div>
                {Array.isArray(data) ? (
                    <div className="relative overflow-x-auto">
                        <table className="w-full border-t text-sm text-left text-gray-500 dark:text-gray-400">
                            <tbody>
                                {data.map((row) => (
                                    <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                        <td className="px-6 py-4 font-mono whitespace-nowrap">
                                            {JSON.stringify(row)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
