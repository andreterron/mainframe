import { PageHeader } from "../components/PageHeader";
import { PageBreadcrumb } from "../components/PageBreadcrumb";
import { BreadcrumbItem, BreadcrumbPage } from "../components/ui/breadcrumb";
import { trpc } from "../lib/trpc_client";
import {
  ItemCard,
  ItemCardContent,
  ItemCardIcon,
} from "../components/ItemCard";
import { datasetIcon } from "../lib/integrations/icons/datasetIcon";
import { useMemo } from "react";
import { SadPath } from "../components/SadPath";

// TODO: Create APIs from the UI

export default function ApisPage() {
  const {
    data: integrations,
    isLoading,
    error,
  } = trpc.integrationsAll.useQuery();

  const apiIntegrations = useMemo(() => {
    return (
      Object.keys(integrations ?? {})
        .map((k) => {
          const integration = integrations?.[k];
          if (!integration || !integrations?.[k]?.hasOpenAPI) {
            return undefined;
          }
          return { ...integration, id: k };
        })
        .filter(Boolean) ?? []
    );
  }, [integrations]);

  if (!integrations) {
    return <SadPath className="p-4" error={error} isLoading={isLoading} />;
  }

  return (
    <div className="flex flex-col items-start gap-4 pb-16">
      <PageHeader
        title={
          <span className="inline-flex items-center">
            <span>APIs</span>
          </span>
        }
        breadcrumb={
          <PageBreadcrumb>
            <BreadcrumbItem>
              <BreadcrumbPage>APIs</BreadcrumbPage>
            </BreadcrumbItem>
          </PageBreadcrumb>
        }
      />

      <div className="p-4 gap-4 grid grid-cols-1 lg:grid-cols-2">
        {apiIntegrations.map((integration) => {
          const icon = datasetIcon(integration.id);
          return (
            <ItemCard key={integration.id} to={`./${integration.id}`}>
              <ItemCardIcon>
                {icon ? (
                  <img
                    className="relative h-5 w-5 m-0.5 object-contain"
                    src={icon}
                  />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    className="relative humbleicons hi-layers h-5 w-5 m-0.5"
                  >
                    <g
                      xmlns="http://www.w3.org/2000/svg"
                      stroke="currentColor"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    >
                      <path d="M4 8l8-4 8 4-8 4-8-4z" />
                      <path
                        strokeLinecap="round"
                        d="M4 12l8 4 8-4M4 16l8 4 8-4"
                      />
                    </g>
                  </svg>
                )}
              </ItemCardIcon>
              <ItemCardContent>
                <span>{integration.name}</span>
              </ItemCardContent>
            </ItemCard>
          );
        })}
      </div>
    </div>
  );
}
