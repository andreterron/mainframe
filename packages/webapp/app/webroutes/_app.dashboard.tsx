import { useNavigate } from "react-router-dom";
import DatasetSetup from "../components/DatasetSetup";
import { trpc } from "../lib/trpc_client";
import { SadPath } from "../components/SadPath";
import { PageHeader } from "../components/PageHeader";

export default function DashboardPage() {
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

  // Functions

  return (
    <div className="flex flex-col items-start gap-4">
      <PageHeader title="Dashboard" />
      <div className="w-full max-w-3xl grid md:grid-cols-2 lg:grid-cols-3 gap-4 px-4"></div>
    </div>
  );
}
