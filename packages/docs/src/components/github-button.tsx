"use client";
import { GitHubIcon } from "./icons/github-icon";
import { StarIcon } from "lucide-react";
import { Button } from "./ui/button";
import { useGitHubStars } from "../lib/github-stars";
import { cn } from "../lib/utils";

export function GitHubStars({ className }: { className?: string }) {
  const stars = useGitHubStars();
  return (
    <span
      className={cn(
        "flex items-center gap-1 text-xs text-muted-foreground",
        className,
      )}
    >
      <StarIcon className="size-3" />
      <span>{stars}</span>
    </span>
  );
}

export function GitHubButton({ className }: { className: string }) {
  return (
    <Button variant="ghost" className={cn("gap-1", className)} asChild>
      <a
        href="https://github.com/andreterron/mainframe"
        target="_blank"
        rel="noopener noreferrer"
      >
        <GitHubIcon className="size-4 mr-2" />
        <GitHubStars />
      </a>
    </Button>
  );
}
