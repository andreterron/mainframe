import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

export function PreviewLabel({ className }: { className?: string }) {
  return (
    <div className={className}>
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div className="border rounded opacity-70 hover:opacity-100 border-gray-400 px-1 py-0.5 text-xs text-gray-600 bg-gray-200 data-[state=delayed-open]:opacity-100">
              Preview
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs" side="bottom" sideOffset={12}>
            <p>
              Experimental feature: Please reach out on{" "}
              <a
                href="https://discord.gg/HUS4y59Dxw"
                target="_blank"
                rel="noopener noreferrer"
                title="Discord"
                className="underline"
              >
                Discord
              </a>{" "}
              and we'll help you!
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
