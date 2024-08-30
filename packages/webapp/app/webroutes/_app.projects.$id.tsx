import { PageHeader } from "../components/PageHeader";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "~/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/api_client";
import { PageBreadcrumb } from "../components/PageBreadcrumb";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../components/ui/breadcrumb";
import { ProjectSetupInstructions } from "../components/ProjectSetupInstructions";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { Badge } from "../components/ui/badge";
import { ProjectUsers } from "../components/ProjectUsers";

export default function ProjectDetailsPage() {
  const params = useParams();

  const { data: app, refetch } = useQuery({
    queryKey: ["projects", params.id] as const,
    queryFn: async ({ queryKey: [, appId] }) => {
      if (!appId) {
        return undefined;
      }
      const res = await apiClient.connect.apps[":app_id"].$get({
        param: {
          app_id: appId,
        },
      });
      return res.json();
    },
  });
  const qc = useQueryClient();
  const navigate = useNavigate();

  const deleteApp = useMutation({
    mutationFn: async () => {
      if (!params.id || !confirm("Delete project?")) {
        return undefined;
      }
      const res = await apiClient.connect.apps[":app_id"].$delete({
        param: {
          app_id: params.id,
        },
      });
      if (!res.ok) {
        throw new Error(
          `Failed to delete app: [${res.status}] ${await res.text()}`,
        );
      }
    },
    onSuccess(data) {
      navigate(`/projects`);
      qc.invalidateQueries(["projects"]);
    },
  });

  const updateApp = useMutation({
    mutationFn: async (app: { name?: string; showSetup?: boolean }) => {
      if (!params.id) {
        return undefined;
      }
      const res = await apiClient.connect.apps[":app_id"].$put({
        param: {
          app_id: params.id,
        },
        json: app,
      });
      if (!res.ok) {
        throw new Error(
          `Failed to update app: [${res.status}] ${await res.text()}`,
        );
      }
      return res.json();
    },
    onSuccess(data) {
      refetch();
      qc.invalidateQueries(["projects"]);
    },
  });

  return (
    <div className="flex flex-col items-start gap-4 pb-16">
      <PageHeader
        title={app?.name || app?.id || ""}
        breadcrumb={
          <PageBreadcrumb>
            <BreadcrumbItem>
              <BreadcrumbLink to={`/projects`}>Projects</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{app?.name || app?.id || ""}</BreadcrumbPage>
            </BreadcrumbItem>
          </PageBreadcrumb>
        }
      >
        <Button
          variant="ghost"
          size="icon"
          title="Delete"
          onClick={() => {
            deleteApp.mutate();
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            className="humbleicons hi-trash text-black w-5 h-5"
          >
            <path
              xmlns="http://www.w3.org/2000/svg"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 6l.934 13.071A1 1 0 007.93 20h8.138a1 1 0 00.997-.929L18 6m-6 5v4m8-9H4m4.5 0l.544-1.632A2 2 0 0110.941 3h2.117a2 2 0 011.898 1.368L15.5 6"
            />
          </svg>
        </Button>
      </PageHeader>
      {!app ? null : (
        <Tabs
          defaultValue={app.showSetup ? "instructions" : "config"}
          className="flex flex-col w-full"
          onValueChange={(value) => {
            if (app.showSetup && value !== "instructions") {
              // TODO: Only hide "showSetup" after we got user access
              updateApp.mutate({ showSetup: false });
            }
          }}
        >
          <TabsList className="grid grid-cols-3 m-4 self-start">
            <TabsTrigger value="config">Config</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
          </TabsList>
          <TabsContent value="config">
            <div className="w-96 p-4">
              {/* TODO: Copy button */}
              <Label className="space-y-1">
                <p className="flex justify-between items-center gap-1 text-base">
                  <span>Project ID:</span>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger>
                      <Badge
                        variant="outline"
                        size="xs"
                        className="text-muted-foreground leading-normal"
                      >
                        public
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent
                      className="max-w-xs"
                      side="bottom"
                      sideOffset={12}
                    >
                      This ID doesn't give access to any private data. Apps will
                      soon be limited to specific domains to prevent app
                      impersonation. Please reach out if you have any questions
                      or suggestions.
                    </TooltipContent>
                  </Tooltip>
                </p>
                <Input
                  className="text-muted-foreground"
                  value={app.id}
                  readOnly
                />
              </Label>
            </div>
          </TabsContent>
          <TabsContent value="connections">
            <div className="p-4 space-y-4">
              <ProjectUsers appId={app.id} />
            </div>
          </TabsContent>
          <TabsContent value="instructions">
            <div className="p-4 space-y-4">
              <ProjectSetupInstructions appId={app.id} />
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
