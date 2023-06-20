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
                "Done!"
            )}
        </div>
    );
}
