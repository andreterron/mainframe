import { ClientIntegration } from "@mainframe-api/shared";
import { datasetIcon } from "../lib/integrations/icons/datasetIcon";
import { trpc } from "../lib/trpc_client";
import { PageHeader } from "./PageHeader";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { AlertCircleIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { UnderReviewMessage } from "./UnderReviewMessage";
import { partition } from "lodash-es";

function IntegrationButton({
  integration,
  type,
  onClick,
}: {
  integration: ClientIntegration;
  type: string;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}) {
  const icon = type ? datasetIcon(type) : undefined;
  const btn = (
    <button
      className="border shadow rounded-lg py-2 px-4 flex items-center gap-2"
      onClick={onClick}
    >
      {icon ? (
        <img
          className={cn(
            "relative h-4 w-4 m-0.5 object-contain shrink-0 grow-0",
            integration.underReview ? "opacity-75" : "",
          )}
          src={icon}
        />
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          className="relative humbleicons hi-layers h-4 w-4 m-0.5"
        >
          <g
            xmlns="http://www.w3.org/2000/svg"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="2"
          >
            <path d="M4 8l8-4 8 4-8 4-8-4z" />
            <path strokeLinecap="round" d="M4 12l8 4 8-4M4 16l8 4 8-4" />
          </g>
        </svg>
      )}
      <span
        className={cn(
          "flex-1 truncate min-w-0 text-start",
          integration.underReview ? "text-muted-foreground" : "",
        )}
      >
        {integration.name}
      </span>
      {integration.underReview && (
        <TooltipTrigger asChild>
          <AlertCircleIcon className="w-4 h-4 text-gray-400" />
        </TooltipTrigger>
      )}
    </button>
  );

  return integration.underReview ? (
    <Tooltip delayDuration={0}>
      {btn}
      <TooltipContent className="max-w-xs" side="bottom" sideOffset={12}>
        <p>
          <UnderReviewMessage integration={integration} />
        </p>
      </TooltipContent>
    </Tooltip>
  ) : (
    btn
  );
}

export default function DatasetSetup({
  onIntegrationSelected,
}: {
  onIntegrationSelected: (type: string) => void;
}) {
  const { data: integrations } = trpc.integrationsAll.useQuery();

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
      <PageHeader title="New Dataset" />
      <div className="px-4 mt-4">
        <h1 className=" text-lg font-medium ">Featured</h1>
        <p className="text-sm text-muted-foreground">
          Easier to connect. Uses OAuth
        </p>
      </div>
      <div className="w-full max-w-3xl grid md:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
        {good.map(([key, integration]) => (
          <IntegrationButton
            key={key}
            integration={integration}
            type={key}
            onClick={() => onIntegrationSelected(key)}
          />
        ))}
      </div>
      <div className="px-4 mt-4">
        <h1 className="text-lg font-medium">All integrations</h1>
        <p className="text-sm text-muted-foreground">Use your own keys</p>
      </div>
      <div className="w-full max-w-3xl grid md:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
        {bad.map(([key, integration]) => (
          <IntegrationButton
            key={key}
            integration={integration}
            type={key}
            onClick={() => onIntegrationSelected(key)}
          />
        ))}
      </div>
    </div>
  );
}
