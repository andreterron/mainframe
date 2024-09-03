import { PageHeader } from "../components/PageHeader";
import { Link, To } from "react-router-dom";
import { PropsWithChildren, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageBreadcrumb } from "../components/PageBreadcrumb";
import { BreadcrumbItem, BreadcrumbPage } from "../components/ui/breadcrumb";
import { PreviewLabel } from "../components/PreviewLabel";
import { apiClient } from "../lib/api_client";
import { cn } from "../lib/utils";
import { ChevronRightIcon, AppWindowIcon, PlusIcon } from "lucide-react";
import type { InferResponseType } from "hono/client";

function ProjectItem({
  className,
  children,
  to,
  icon,
  app,
}: PropsWithChildren<{
  className?: string;
  to: To;
  icon: ReactNode;
  app?: InferResponseType<typeof apiClient.connect.apps.$get>[number];
}>) {
  return (
    <Link
      className={cn(
        "border flex items-center w-80 h-16 rounded-lg shadow px-3 text-sm font-semibold py-3 hover:bg-accent transition",
        className,
      )}
      to={to}
    >
      <div
        className={`flex items-center justify-center p-2 rounded-full mr-2 ${
          app ? "bg-gradient-to-r from-emerald-200 to-sky-200" : "bg-secondary"
        }`}
      >
        {icon}
      </div>
      <div className="flex flex-col">
        {children}
        {app?.id && (
          <div className="text-muted-foreground text-xs font-normal">
            <span className="font-mono">
              {app.id.slice(0, 4)}
              <span className="font-sans">…</span>
              {app.id.slice(-4)}
            </span>
            {typeof app.connectionsCount === "number" &&
              ` • ${
                app.connectionsCount === 0
                  ? "no connections"
                  : app.connectionsCount === 1
                  ? "1 connection"
                  : `${app.connectionsCount} connections`
              }`}
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
              app={app}
              icon={<AppWindowIcon className="size-4" />}
            >
              {app.name || app.id}
            </ProjectItem>
          );
        })}
        <ProjectItem
          className="text-muted-foreground font-normal"
          to="/projects/new"
          icon={<PlusIcon className="size-4" />}
        >
          Create a new project
        </ProjectItem>
      </div>
    </div>
  );
}
