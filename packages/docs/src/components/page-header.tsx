import { cn } from "../lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { MainframeLogo } from "./mainframe-logo";
import { GitHubButton } from "./github-button";
import { DiscordIcon } from "./icons/discord-icon";
import { Button } from "./ui/button";
import { XIcon } from "./icons/x-icon";
import { MenuIcon } from "lucide-react";
import { SheetTrigger } from "./ui/sheet";

export function PageHeader({ className }: { className: string }) {
  return (
    <div
      className={cn(
        "sticky top-0",
        "w-full flex items-center gap-2 py-4 px-8",
        "border-b border-border/40 text-amber-950 dark:text-amber-50 bg-background/70 dark:bg-background/30 backdrop-blur-lg z-10 shadow-xs",
        "before:absolute before:inset-0 before:bg-amber-100/20 dark:before:bg-transparent [&>*]:relative",
        "hover:[&_.rounded-md]:bg-primary/15",
        className,
      )}
    >
      <SheetTrigger className="lg:hidden" asChild>
        <Button variant="ghost" size="icon">
          <MenuIcon className="size-5" />
        </Button>
      </SheetTrigger>
      {/* TODO: Link to localhost in dev mode */}
      <a
        href="https://mainframe.so"
        className="pt-1.5 px-0.5 pb-1 border-b-2 border-b-amber-300 dark:border-b-amber-500 -mr-0.5"
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
