import { useParams } from "react-router-dom";
import DatasetSetup from "../components/DatasetSetup";
import DatasetTokenInput from "../components/DatasetTokenInput";
import { DatasetPage } from "../components/DatasetPage";
import { trpc } from "../lib/trpc_client";
import { SadPath } from "../components/SadPath";
import { DatasetCredentials } from "@mainframe-so/shared";

export default function DatasetDetails() {
  const { id } = useParams();

  const {
    data: dataset,
    refetch,
    error: datasetError,
    isLoading: isDatasetLoading,
  } = trpc.datasetsGet.useQuery(
    {
      id: id ?? "",
    },
    { enabled: !!id },
  );
  const {
    data: integrations,
    error: integrationsError,
    isLoading: isIntegrationsLoading,
  } = trpc.integrationsAll.useQuery();

  const datasetsUpdate = trpc.datasetsUpdate.useMutation({
    onSettled() {
      refetch();
    },
  });

  if (!dataset || !integrations) {
    return (
      <SadPath
        className="p-4"
        error={datasetError ?? integrationsError ?? undefined}
        isLoading={isDatasetLoading || isIntegrationsLoading}
      />
    );
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
        name: dataset.name ? undefined : integration.name,
      },
    });
  }

  return (
    <div className="flex flex-col">
      {!dataset.integrationType ? (
        <DatasetSetup
          onIntegrationSelected={(type) => setIntegrationType(type)}
        />
      ) : integrations?.[dataset.integrationType] ? (
        integrations?.[dataset.integrationType].authType !== "none" &&
        !dataset.credentials?.token &&
        !dataset.credentials?.accessToken &&
        !dataset.credentials?.nangoIntegrationId ? (
          <DatasetTokenInput
            dataset={dataset}
            integration={integrations[dataset.integrationType]}
          />
        ) : (
          <DatasetPage
            dataset={dataset}
            integration={integrations[dataset.integrationType]}
          />
        )
      ) : (
        <span className="p-4">Error: Integration not found</span>
      )}
    </div>
  );
}
