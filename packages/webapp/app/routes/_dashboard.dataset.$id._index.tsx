import { useLoaderData, useParams, useRevalidator } from "@remix-run/react";
import DatasetSetup from "../components/DatasetSetup";
import DatasetTokenInput from "../components/DatasetTokenInput";
import {
    getIntegrationForDataset,
    getIntegrationFromType,
} from "../lib/integrations";
import { DatasetPage } from "../components/DatasetPage";
import { trpc } from "../lib/trpc_client";
import { LoaderArgs, json } from "@remix-run/node";
import { db } from "../db/db.server";
import { datasetsTable } from "../db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "remix-utils";

export async function loader({ params }: LoaderArgs) {
    const id = params.id;

    if (!id) {
        throw notFound({});
    }

    const [dataset] = await db
        .select()
        .from(datasetsTable)
        .where(eq(datasetsTable.id, id))
        .limit(1);

    if (!dataset) {
        throw notFound({});
    }

    return json({ dataset });
}

export default function DatasetDetails() {
    const { id } = useParams();

    const { dataset } = useLoaderData<typeof loader>();

    const { revalidate } = useRevalidator();

    const datasetsUpdate = trpc.datasetsUpdate.useMutation({
        onSettled() {
            revalidate();
        },
    });

    // Functions

    function setIntegrationType(integrationType: string) {
        if (!dataset || !id) {
            console.error("No doc to set integration type");
            return;
        }
        const integration = getIntegrationFromType(integrationType);
        datasetsUpdate.mutate({
            id,
            patch: {
                integrationType,
                name: dataset.name ? undefined : integration?.name,
            },
        });
    }

    function setToken(token: string) {
        if (!dataset || !id) {
            console.error("No doc to set token");
            return;
        }
        datasetsUpdate.mutate({ id, patch: { token } });
    }

    const integration = getIntegrationForDataset(dataset);

    return (
        <div className="flex flex-col p-4">
            {!dataset.integrationType ? (
                <DatasetSetup
                    onIntegrationSelected={(type) => setIntegrationType(type)}
                    dataset={dataset}
                />
            ) : !dataset.token ? (
                <DatasetTokenInput
                    onSubmit={(token) => setToken(token)}
                    dataset={dataset}
                />
            ) : integration ? (
                <DatasetPage dataset={dataset} />
            ) : (
                <span>Error: Integration not found</span>
            )}
        </div>
    );
}
