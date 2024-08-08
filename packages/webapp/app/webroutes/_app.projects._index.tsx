import { PageHeader } from "../components/PageHeader";
import { Link, To } from "react-router-dom";
import { PropsWithChildren } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageBreadcrumb } from "../components/PageBreadcrumb";
import { BreadcrumbItem, BreadcrumbPage } from "../components/ui/breadcrumb";
import { PreviewLabel } from "../components/PreviewLabel";
import { apiClient } from "../lib/api_client";
import { cn } from "../lib/utils";
import { AppWindowIcon, PlusSquareIcon } from "lucide-react";

function ProjectItem({
  className,
  children,
  to,
}: PropsWithChildren<{ className?: string; to: To }>) {
  return (
    <Link
      className={cn(
        "border flex items-center h-12 w-80 rounded shadow px-3",
        className,
      )}
      to={to}
    >
      {children}
    </Link>
  );
}

export default function ProjectsPage() {
  const { data: apps } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await apiClient.connect.apps.$get();
      return res.json();
    },
  });

  // TODO: Handle errors / loading

  return (
    <div className="flex flex-col items-start gap-4 pb-16">
      <PageHeader
        title={
          <span className="inline-flex items-center">
            <span>Projects</span>
            <PreviewLabel className="ml-2 mt-0.5 inline-flex" />
          </span>
        }
        breadcrumb={
          <PageBreadcrumb>
            <BreadcrumbItem>
              <BreadcrumbPage>Projects</BreadcrumbPage>
            </BreadcrumbItem>
          </PageBreadcrumb>
        }
      />
      <div className="p-4 space-y-4">
        {apps?.map((app) => {
          return (
            <ProjectItem key={app.id} to={`/projects/${app.id}`}>
              <AppWindowIcon className="size-4 mr-2" />
              {app.name || app.id}
            </ProjectItem>
          );
        })}
        <ProjectItem className="text-muted-foreground" to="/projects/new">
          <PlusSquareIcon className="size-4 mr-2" />
          New Project
        </ProjectItem>
      </div>
    </div>
  );
}
