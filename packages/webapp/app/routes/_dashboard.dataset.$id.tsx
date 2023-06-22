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
import DatasetSetup from "../components/DatasetSetup";
import DatasetOAKTokenInput from "../components/DatasetOAKTokenInput";

export const meta: V2_MetaFunction<typeof loader> = (args) => {
    const dataset = args.data?.initialDatasetValue;
    return [{ title: dataset?.name ? dataset.name : "Mainframe" }];
};

export async function loader({ params }: LoaderArgs) {
    const id = params.id;
    if (!id) {
        throw new Response("Missing dataset ID", { status: 404 });
    }
    try {
        const dataset = await db.get(id);
        return json({
            initialDatasetValue: dataset,
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

const types = ["Time Entries", "Projects", "Workspaces", "Clients"];

export default function DatasetDetails() {
    const { initialDatasetValue } = useLoaderData<typeof loader>();
    const { id } = useParams();
    const { doc, error } = useDoc<DBTypes>(id ?? "", {}, initialDatasetValue);
    const dataset = doc ?? initialDatasetValue;

    // Functions

    function setIntegrationType(integrationType: string) {
        if (!doc) {
            console.error("No doc to set integration type");
            return;
        }
        db.put({
            ...doc,
            integrationType,
            name: doc.name ? doc.name : "Toggl",
        });
    }

    function setOakToken(token: string) {
        if (!doc) {
            console.error("No doc to set token");
            return;
        }
        db.put({ ...doc, oakToken: token });
    }

    // Early return

    if (!dataset || error) {
        // TODO: If we get an error, we might want to throw
        console.log("useDoc error", error);
        // TODO: Loading UI if we need to
        return null;
    }

    return (
        <div className="flex flex-col">
            {/* TODO: Header */}
            {!doc?.integrationType ? (
                <DatasetSetup
                    onIntegrationSelected={(type) => setIntegrationType(type)}
                />
            ) : !doc?.oakToken ? (
                <DatasetOAKTokenInput
                    onSubmit={(token) => setOakToken(token)}
                />
            ) : (
                <div className="flex flex-col gap-8 items-start">
                    <h1 className="text-2xl font-medium">{doc.name}</h1>
                    <div className="flex flex-col gap-1">
                        {types.map((type) => (
                            <span className="flex items-center gap-3 cursor-pointer select-none text-gray-900 bg-white focus:outline-none hover:bg-gray-100 active:bg-gray-200 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg px-4 py-2 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 dark:focus:ring-gray-700">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    className="humbleicons hi-database flex-grow-0 flex-shrink-0 w-5 h-5"
                                >
                                    <g
                                        xmlns="http://www.w3.org/2000/svg"
                                        stroke="currentColor"
                                        stroke-width="2"
                                    >
                                        <path d="M20 12c0 1.657-3.582 3-8 3s-8-1.343-8-3M20 18c0 1.657-3.582 3-8 3s-8-1.343-8-3" />
                                        <ellipse cx="12" cy="6" rx="8" ry="3" />
                                        <path d="M4 6v12M20 6v12" />
                                    </g>
                                </svg>
                                <span>{type}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
