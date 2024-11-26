import { ClientIntegration } from "@mainframe-api/shared";
import { datasetIcon } from "../lib/integrations/icons/datasetIcon";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { AlertCircleIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { UnderReviewMessage } from "./UnderReviewMessage";
import { Link } from "react-router-dom";

export function IntegrationButton({
  integration,
  type,
}: {
  integration: ClientIntegration;
  type: string;
}) {
  const icon = type ? datasetIcon(type) : undefined;
  const btn = (
    <Link
      className="border shadow rounded-lg py-2 px-4 flex items-center gap-2"
      to={`/accounts/new/${type}`}
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
    </Link>
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
