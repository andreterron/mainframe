import { PageHeader } from "../components/PageHeader";
import { Link, To } from "react-router-dom";
import { PropsWithChildren, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageBreadcrumb } from "../components/PageBreadcrumb";
import { BreadcrumbItem, BreadcrumbPage } from "../components/ui/breadcrumb";
import { PreviewLabel } from "../components/PreviewLabel";
import { apiClient } from "../lib/api_client";
import { cn } from "../lib/utils";
import { ChevronRightIcon, AppWindowIcon, PlusSquareIcon } from "lucide-react";

function ProjectItem({
  className,
  children,
  to,
  icon,
  appId,
}: PropsWithChildren<{
  className?: string;
  to: To;
  icon: ReactNode;
  appId?: string;
}>) {
  return (
    // TODO: Consider setting a fixed height
    <Link
      className={cn(
        "border flex items-center w-80 rounded-lg shadow px-3 text-sm font-semibold py-3 hover:bg-accent transition",
        className,
      )}
      to={to}
    >
      <div
        className={`flex items-center justify-center p-2 rounded-full mr-2 ${
          appId
            ? "bg-gradient-to-r from-emerald-200 to-sky-200"
            : "bg-secondary"
        }`}
      >
        {icon}
      </div>
      <div className="flex flex-col">
        {children}
        {appId && (
          <div className="text-muted-foreground text-xs font-normal">
            {appId.slice(0, 4)}...{appId.slice(-4)}
          </div>
        )}
      </div>
      {to !== "/projects/new" && (
        <ChevronRightIcon className="w-4 h-4 text-muted-foreground/40 ml-auto" />
      )}
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
            <ProjectItem
              key={app.id}
              to={`/projects/${app.id}`}
              appId={app.id}
              icon={<AppWindowIcon className="size-4 mr-2" />}
            >
              {app.name || app.id}
            </ProjectItem>
          );
        })}
        <ProjectItem
          className="text-muted-foreground font-normal"
          to="/projects/new"
          icon={<PlusSquareIcon className="size-4 mr-2" />}
        >
          Create a new project
        </ProjectItem>
      </div>
    </div>
  );
}
