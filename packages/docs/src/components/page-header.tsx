import { cn } from "../lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { MainframeLogo } from "./mainframe-logo";
import { GitHubButton } from "./github-button";
import { DiscordIcon } from "./icons/discord-icon";
import { Button } from "./ui/button";
import { XIcon } from "./icons/x-icon";

export function PageHeader({ className }: { className: string }) {
  return (
    <div
      className={cn(
        "w-full flex items-center gap-2 py-4 px-8 border-b",
        className,
      )}
    >
      {/* TODO: Link to localhost in dev mode */}
      <a
        href="https://mainframe.so"
        target="_self"
        className="text-lg font-bold inline-block shrink-0"
      >
        <MainframeLogo className="w-36" />
      </a>
      <div className="flex-1"></div>

      <GitHubButton />
      <Button variant="ghost" size="icon" asChild>
        <a
          href="https://discord.gg/HUS4y59Dxw"
          target="_blank"
          rel="noopener noreferrer"
        >
          <DiscordIcon className="size-4" />
        </a>
      </Button>
      <Button variant="ghost" size="icon" asChild>
        <a
          href="https://x.com/MainframeAPI"
          target="_blank"
          rel="noopener noreferrer"
        >
          <XIcon className="size-3" />
        </a>
      </Button>
      <ThemeToggle variant="ghost" size="icon" />
    </div>
  );
}