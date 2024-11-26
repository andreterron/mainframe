import { trpc } from "../lib/trpc_client";
import { SadPath } from "../components/SadPath";
import { partition } from "lodash-es";
import { PageHeader } from "../components/PageHeader";
import { PageBreadcrumb } from "../components/PageBreadcrumb";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../components/ui/breadcrumb";
import { IntegrationButton } from "../components/IntegrationButton";

export default function NewPage() {
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

  const [good, bad] = partition(
    Object.entries(integrations ?? []),
    ([, integration]) => {
      return (
        !integration.underReview && integration.authTypes?.nango?.integrationId
      );
    },
  );

  return (
    <div className="flex flex-col items-start gap-4">
      <PageHeader
        title="Connect Account"
        breadcrumb={
          <PageBreadcrumb>
            <BreadcrumbItem>
              <BreadcrumbLink to={`/accounts`}>Accounts</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Connect Account</BreadcrumbPage>
            </BreadcrumbItem>
          </PageBreadcrumb>
        }
      />
      <div className="px-4 mt-4">
        <h1 className=" text-lg font-medium ">Featured</h1>
        <p className="text-sm text-muted-foreground">
          Easier to connect. Uses OAuth
        </p>
      </div>
      <div className="w-full max-w-3xl grid md:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
        {good.map(([key, integration]) => (
          <IntegrationButton key={key} integration={integration} type={key} />
        ))}
      </div>
      <div className="px-4 mt-4">
        <h1 className="text-lg font-medium">All integrations</h1>
        <p className="text-sm text-muted-foreground">Use your own keys</p>
      </div>
      <div className="w-full max-w-3xl grid md:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
        {bad.map(([key, integration]) => (
          <IntegrationButton key={key} integration={integration} type={key} />
        ))}
      </div>
    </div>
  );
}
