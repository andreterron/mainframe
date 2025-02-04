import { PageHeader } from "../components/PageHeader";
import { Link, Outlet, useMatch, useParams } from "react-router-dom";
import { PageBreadcrumb } from "../components/PageBreadcrumb";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../components/ui/breadcrumb";
import { trpc } from "../lib/trpc_client";
import { SadPath } from "../components/SadPath";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";

export default function ApiServicePage() {
  const {
    data: integrations,
    isLoading,
    error,
  } = trpc.integrationsAll.useQuery();
  const params = useParams();
  const service_id = params.service;
  const integration = service_id ? integrations?.[service_id] : undefined;

  const swaggerMatch = useMatch("/apis/:service/swagger_ui");

  if (!integration) {
    return <SadPath className="p-4" error={error} isLoading={isLoading} />;
  }

  return (
    <div className="flex flex-col items-start gap-4 pb-16">
      <PageHeader
        title={
          <span className="inline-flex items-center">
            <span>{integration.name}</span>
          </span>
        }
        breadcrumb={
          <PageBreadcrumb>
            <BreadcrumbLink to={"/apis"}>
              <BreadcrumbPage>APIs</BreadcrumbPage>
            </BreadcrumbLink>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{integration.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </PageBreadcrumb>
        }
      />

      <Tabs
        defaultValue="table"
        className="flex flex-col w-full"
        value={swaggerMatch ? "swagger" : "home"}
      >
        <TabsList className="grid grid-cols-2 m-4 self-start">
          <TabsTrigger value="home" asChild>
            <Link to={`/apis/${"toggl"}/`}>List</Link>
          </TabsTrigger>
          <TabsTrigger value="swagger" asChild>
            <Link to={`/apis/${"toggl"}/swagger_ui`}>Swagger</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Outlet />
    </div>
  );
}
