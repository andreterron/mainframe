import { useNavigate, useParams } from "react-router-dom";
import DatasetSetup from "../components/DatasetSetup";
import { trpc } from "../lib/trpc_client";
import { SadPath } from "../components/SadPath";

export default function TemplatePage() {
  const { id: templateId } = useParams();
  const {
    data: integrations,
    error: integrationsError,
    isLoading: isIntegrationsLoading,
  } = trpc.integrationsAll.useQuery();

  if (!integrations) {
    return (
      <SadPath
        className="p-4"
        error={integrationsError ?? undefined}
        isLoading={isIntegrationsLoading}
      />
    );
  }

  return <div className="flex flex-col">Template {templateId}</div>;
}
