import { useRef, useState } from "react";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "~/lib/api_client";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Check, Copy } from "lucide-react";

type ProjectInfoProps = {
  id: string;
  name: string;
};

export default function ProjectInfo({ id, name }: ProjectInfoProps) {
  const [projectName, setProjectName] = useState(name);
  const [copied, setCopied] = useState(false);
  const qc = useQueryClient();

  const updateProjectName = useMutation({
    mutationFn: async (newName: string) => {
      const response = await apiClient.connect.apps[":app_id"].$put({
        param: { app_id: id },
        json: { name: newName },
      });
      return response.json();
    },
    onSuccess: () => {
      qc.invalidateQueries(["projects", id]);
    },
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectName(e.target.value);
  };

  const handleNameBlur = () => {
    formRef.current?.requestSubmit();
  };

  const handleSubmit = () => {
    if (projectName !== name) {
      updateProjectName.mutate(projectName);
    }
  };

  const formRef = useRef<HTMLFormElement | null>(null);

  const handleCopyId = () => {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="w-96 p-4 flex flex-col gap-6">
      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div className="space-y-1">
          <Label htmlFor="project-name" className="text-sm">
            Project Name
          </Label>
          <Input
            id="project-name"
            value={projectName}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            autoComplete="off"
          />
          <p
            className={cn(
              "font-normal text-muted-foreground text-xs transition-opacity duration-75",
              projectName === name ? "opacity-0" : "opacity-100",
            )}
          >
            Unsaved changes.{" "}
            <button className="text-foreground">Save now</button>
          </p>
        </div>
      </form>

      <div className="space-y-1">
        <div className="flex justify-between items-center gap-1 text-sm">
          <Label htmlFor="project-id" className="text-sm">
            Project ID
          </Label>
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
            <TooltipContent className="max-w-xs" side="bottom" sideOffset={12}>
              This ID doesn't give access to any private data. Apps will soon be
              limited to specific domains to prevent app impersonation. Please
              reach out if you have any questions or suggestions.
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="relative">
          <Input
            id="project-id"
            className="text-muted-foreground bg-primary-foreground pr-10"
            value={id}
            readOnly
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={handleCopyId}
            title="Copy Project ID"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="font-normal text-muted-foreground text-xs">
          This is your app ID in your MainframeProvider
        </p>
      </div>
      {/* <h2 className="text-lg font-semibold">Integrations</h2> */}
    </div>
  );
}
