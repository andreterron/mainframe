import { useParams } from "react-router-dom";
import DatasetSetup from "../components/DatasetSetup";
import DatasetTokenInput from "../components/DatasetTokenInput";
import { DatasetPage } from "../components/DatasetPage";
import { trpc } from "../lib/trpc_client";
import { SadPath } from "../components/SadPath";
import { DatasetCredentials } from "../lib/types";

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
        name: dataset.name ? undefined : integration?.name,
      },
    });
  }

  function setCredentials(credentials: DatasetCredentials) {
    if (!dataset || !id) {
      console.error("No doc to set token");
      return;
    }
    datasetsUpdate.mutate({ id, patch: { credentials } });
  }

  return (
    <div className="flex flex-col p-4">
      {!dataset.integrationType ? (
        <DatasetSetup
          onIntegrationSelected={(type) => setIntegrationType(type)}
          dataset={dataset}
        />
      ) : integrations?.[dataset.integrationType] ? (
        integrations?.[dataset.integrationType].authType !== "none" &&
        !dataset.credentials?.token &&
        !dataset.credentials?.accessToken ? (
          <DatasetTokenInput
            onSubmit={(creds) => setCredentials(creds)}
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
        <span>Error: Integration not found</span>
      )}
    </div>
  );
}
