import { useParams } from "react-router-dom";
import DatasetSetup from "../components/DatasetSetup";
import DatasetTokenInput from "../components/DatasetTokenInput";
import {
    getIntegrationForDataset,
    getIntegrationFromType,
} from "../lib/integrations";
import { DatasetPage } from "../components/DatasetPage";
import { trpc } from "../lib/trpc_client";

export default function DatasetDetails() {
    const { id } = useParams();

    // TODO: handle undefined/empty id
    const { data: dataset, refetch } = trpc.datasetsGet.useQuery({
        id: id ?? "",
    });

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
