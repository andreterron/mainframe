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
import TableSetup from "../components/TableSetup";
import TableOAKTokenInput from "../components/TableOAKTokenInput";

export const meta: V2_MetaFunction<typeof loader> = (args) => {
    const table = args.data?.initialTableData;
    return [{ title: table?.name ? table.name : "Mainframe" }];
};

export async function loader({ params }: LoaderArgs) {
    const id = params.id;
    if (!id) {
        throw new Response("Missing table ID", { status: 404 });
    }
    try {
        const table = await db.get(id);
        return json({
            initialTableData: table,
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

export default function TableDetails() {
    const { initialTableData } = useLoaderData<typeof loader>();
    const { id } = useParams();
    const { doc, error } = useDoc<DBTypes>(id ?? "", {}, initialTableData);
    const table = doc ?? initialTableData;

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

    if (!table || error) {
        // TODO: If we get an error, we might want to throw
        console.log("useDoc error", error);
        // TODO: Loading UI if we need to
        return null;
    }

    return (
        <div className="flex flex-col">
            {/* TODO: Header */}
            {!doc?.integrationType ? (
                <TableSetup
                    onIntegrationSelected={(type) => setIntegrationType(type)}
                />
            ) : !doc?.oakToken ? (
                <TableOAKTokenInput onSubmit={(token) => setOakToken(token)} />
            ) : (
                "Done!"
            )}
        </div>
    );
}
