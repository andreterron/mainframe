import { useParams } from "react-router-dom";
import DatasetSetup from "../components/DatasetSetup";
import DatasetTokenInput from "../components/DatasetTokenInput";
import { DatasetPage } from "../components/DatasetPage";
import { trpc } from "../lib/trpc_client";

export default function DatasetDetails() {
    const { id } = useParams();

    // TODO: handle undefined/empty id
    const { data: dataset, refetch } = trpc.datasetsGet.useQuery({
        id: id ?? "",
    });
    const { data: integrations } = trpc.integrationsAll.useQuery();

    const datasetsUpdate = trpc.datasetsUpdate.useMutation({
        onSettled() {
            refetch();
        },
    });

    if (!dataset) {
        // TODO: Handle loading, error or not found
        return null;
    }

    // Functions

    function setIntegrationType(integrationType: string) {
        if (!dataset || !id) {
            console.error("No doc to set integration type");
            return;
        }
        const integration = integrations?.[integrationType];
        if (!integration) {
            console.error("Integration not found for type", integrationType);
            return;
        }
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
            ) : integrations?.[dataset.integrationType] ? (
                <DatasetPage
                    dataset={dataset}
                    integration={integrations[dataset.integrationType]}
                />
            ) : (
                <span>Error: Integration not found</span>
            )}
        </div>
    );
}
