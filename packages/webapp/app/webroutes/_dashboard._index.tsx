import { useNavigate } from "react-router-dom";
import DatasetSetup from "../components/DatasetSetup";
import { trpc } from "../lib/trpc_client";

export default function Index() {
  const navigate = useNavigate();
  const utils = trpc.useContext();

  const datasetsCreate = trpc.datasetsCreate.useMutation({
    onSettled() {
      utils.datasetsAll.invalidate();
    },
  });

  const { data: integrations } = trpc.integrationsAll.useQuery();

  async function setIntegrationType(integrationType: string) {
    const integration = integrations?.[integrationType];
    if (!integration) {
      console.error("Integration not found for type", integrationType);
      return;
    }

    const dataset = await datasetsCreate.mutateAsync({
      integrationType,
      name: integration?.name,
    });

    navigate(`/dataset/${dataset.id}`);
  }

  // TODO: Consider a different UI if the user already has existing datasets

  return (
    <div className="flex flex-col p-4">
      <DatasetSetup
        onIntegrationSelected={(type) => setIntegrationType(type)}
      />
    </div>
  );
}
