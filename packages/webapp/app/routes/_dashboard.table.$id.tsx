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
    if (!table || error) {
        console.log("useDoc error", error);
        return null;
    }
    return (
        <>
            Table!
            <br />
            {table._id}
            <br />
            {table.name}
        </>
    );
}
