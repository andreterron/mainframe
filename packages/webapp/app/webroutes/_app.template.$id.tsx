import { useParams } from "react-router-dom";
import { trpc } from "../lib/trpc_client";
import { SadPath } from "../components/SadPath";
import { PageBreadcrumb } from "../components/PageBreadcrumb";
import {
  BreadcrumbItem,
  BreadcrumbSeparator,
} from "../components/ui/breadcrumb";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useMemo } from "react";

const acceptedIntegrationsTypes = ["github"];

export default function TemplatePage() {
  const { id: templateId } = useParams();
  const {
    data: integrations,
    error: integrationsError,
    isLoading: isIntegrationsLoading,
  } = trpc.integrationsAll.useQuery();

  const { data: datasets } = trpc.datasetsAll.useQuery();

  const validDatasets = useMemo(
    () =>
      datasets?.filter(
        (d) =>
          d.integrationType &&
          acceptedIntegrationsTypes.includes(d.integrationType),
      ),
    [datasets, acceptedIntegrationsTypes],
  );

  if (!integrations) {
    return (
      <SadPath
        className="p-4"
        error={integrationsError ?? undefined}
        isLoading={isIntegrationsLoading}
      />
    );
  }
  const name = "GitHub stars";

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Setup template"
        breadcrumb={
          <PageBreadcrumb>
            {/* TODO: Link to a /templates page */}
            <BreadcrumbItem>Templates</BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>{name}</BreadcrumbItem>
          </PageBreadcrumb>
        }
      />

      <div className="px-4">
        <Card className="w-72">
          <div className="bg-gray-200 h-40 w-full rounded-t"></div>
        </Card>
        <div className="mt-4 space-y-4">
          {validDatasets?.length ? (
            <div className="space-y-1.5">
              <h4 className="text-muted-foreground uppercase text-xs font-semibold">
                Your integrations
              </h4>
              {validDatasets.map((d) => (
                <Button variant="outline">{d.name}</Button>
              ))}
            </div>
          ) : null}
          <div className="space-y-1.5">
            <h4 className="text-muted-foreground uppercase text-xs font-semibold mt-4">
              New integration
            </h4>
            <Button variant="outline">GitHub</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
