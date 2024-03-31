import { useNavigate } from "react-router-dom";
import DatasetSetup from "../components/DatasetSetup";
import { trpc } from "../lib/trpc_client";
import { SadPath } from "../components/SadPath";

export default function NewPage() {
  const {
    data: integrations,
    error: integrationsError,
    isLoading: isIntegrationsLoading,
  } = trpc.integrationsAll.useQuery();
  const navigate = useNavigate();

  const utils = trpc.useContext();

  const datasetsCreate = trpc.datasetsCreate.useMutation({
    onSettled() {
      utils.datasetsAll.invalidate();
    },
  });

  if (!integrations) {
    return (
      <SadPath
        className="p-4"
        error={integrationsError ?? undefined}
        isLoading={isIntegrationsLoading}
      />
    );
  }

  // Functions

  const handleAddDataset = async (integrationType: string) => {
    const integration = integrations?.[integrationType];
    if (!integration) {
      console.error("Integration not found for type", integrationType);
      return;
    }
    const dataset = await datasetsCreate.mutateAsync({
      integrationType,
      name: integration.name,
    });
    navigate(`/dataset/${dataset.id}`);
  };

  return (
    <div className="flex flex-col">
      <DatasetSetup
        onIntegrationSelected={(type) => {
          handleAddDataset(type);
        }}
      />
    </div>
  );
}
