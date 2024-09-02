import { useState } from "react";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "~/lib/api_client";

type ProjectInfoProps = {
  id: string;
  name: string;
};

export default function ProjectInfo({ id, name }: ProjectInfoProps) {
  const [projectName, setProjectName] = useState(name);
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
    if (projectName !== name) {
      updateProjectName.mutate(projectName);
    }
  };

  return (
    <div className="w-96 p-4 flex flex-col gap-6">
      {/* TODO: Copy button */}
      <Label className="space-y-1">
        <span className="text-sm">Project Name</span>
        <Input
          value={projectName}
          onChange={handleNameChange}
          onBlur={handleNameBlur}
        />
      </Label>

      <Label className="space-y-1">
        <p className="flex justify-between items-center gap-1 text-sm">
          <span>Project ID</span>
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
        </p>
        <Input
          className="text-muted-foreground bg-primary-foreground"
          value={id}
          readOnly
        />
        <p className="font-normal text-muted-foreground">
          This is your app ID in your MainframeProvider
        </p>
      </Label>
      <h2 className="text-lg font-semibold">Integrations</h2>
    </div>
  );
}
