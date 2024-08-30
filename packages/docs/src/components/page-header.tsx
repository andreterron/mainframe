import { cn } from "../lib/utils";
import { ThemeSubmenu, ThemeToggle } from "./theme-toggle";
import { LinkedMainframeLogo } from "./mainframe-logo";
import { GitHubButton, GitHubStars } from "./github-button";
import { DiscordIcon } from "./icons/discord-icon";
import { Button } from "./ui/button";
import { XIcon } from "./icons/x-icon";
import { MenuIcon, MoreVerticalIcon } from "lucide-react";
import { SheetTrigger } from "./ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { GitHubIcon } from "./icons/github-icon";
import { DropdownMenuItemIndicator } from "@radix-ui/react-dropdown-menu";
import Link from "next/link";

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
      <LinkedMainframeLogo className="w-36" />
      <div className="flex-1"></div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="sm:hidden"
            variant="ghost"
            size="icon"
            title="More items"
          >
            <MoreVerticalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="sm:hidden" align="end">
          <DropdownMenuItem asChild>
            <a
              href="https://github.com/andreterron/mainframe"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitHubIcon className="size-4 mr-2" />
              GitHub
              <GitHubStars className="ml-4" />
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href="https://discord.gg/HUS4y59Dxw"
              target="_blank"
              rel="noopener noreferrer"
            >
              <DiscordIcon className="size-4 mr-2" />
              Discord
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href="https://x.com/MainframeAPI"
              target="_blank"
              rel="noopener noreferrer"
            >
              <XIcon className="w-4 h-3 mr-2" />
              Follow us
            </a>
          </DropdownMenuItem>
          <ThemeSubmenu />
        </DropdownMenuContent>
      </DropdownMenu>

      <GitHubButton className="max-sm:hidden" />
      <Button className="max-sm:hidden" variant="ghost" size="icon" asChild>
        <a
          href="https://discord.gg/HUS4y59Dxw"
          target="_blank"
          rel="noopener noreferrer"
        >
          <DiscordIcon className="size-4" />
        </a>
      </Button>
      <Button className="max-sm:hidden" variant="ghost" size="icon" asChild>
        <a
          href="https://x.com/MainframeAPI"
          target="_blank"
          rel="noopener noreferrer"
        >
          <XIcon className="size-3" />
        </a>
      </Button>
      <ThemeToggle className="max-sm:hidden" variant="ghost" size="icon" />
    </div>
  );
}
