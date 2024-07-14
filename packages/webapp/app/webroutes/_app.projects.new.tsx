import { PageHeader } from "../components/PageHeader";
import { useNavigate } from "react-router-dom";
import { Button } from "~/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/api_client";
import { z } from "zod";
import { PageBreadcrumb } from "../components/PageBreadcrumb";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../components/ui/breadcrumb";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export default function NewProjectPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const createApp = useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      const res = await apiClient.apps.$post({
        json: {
          name,
        },
      });
      if (!res.ok) {
        throw new Error(
          `Failed to create app. [${res.status}] ${await res.text()}`,
        );
      }
      const app = await res.json();
      return app;
    },
    onSuccess(data) {
      navigate(`/projects/${data.id}`);
      qc.invalidateQueries(["projects"]);
    },
  });

  return (
    <div className="flex flex-col items-start gap-4 pb-16">
      <PageHeader
        title="New Project"
        breadcrumb={
          <PageBreadcrumb>
            <BreadcrumbItem>
              <BreadcrumbLink to={`/projects`}>Projects</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>New Project</BreadcrumbPage>
            </BreadcrumbItem>
          </PageBreadcrumb>
        }
      />
      <form
        className="p-4 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          const name = z.string().parse(formData.get("name"));
          createApp.mutate({
            name,
          });
        }}
      >
        {/* TODO: Auto-generated names */}
        <Label htmlFor="name">
          Name:
          <Input name="name" placeholder="My first app" />
        </Label>
        <Button variant="default" disabled={createApp.isLoading}>
          Create
        </Button>
      </form>
    </div>
  );
}
