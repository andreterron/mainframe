"use client";
import { GitHubIcon } from "./icons/github-icon";
import { StarIcon } from "lucide-react";
import { Button } from "./ui/button";
import { useEffect } from "react";
import { useGitHubStars } from "../lib/github-stars";

export function GitHubButton() {
  const stars = useGitHubStars();
  return (
    <Button variant="ghost" className="gap-1" asChild>
      <a
        href="https://github.com/andreterron/mainframe"
        target="_blank"
        rel="noopener noreferrer"
      >
        <GitHubIcon className="size-4 mr-2" />
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <StarIcon className="size-3" />
          <span>{stars}</span>
        </span>
      </a>
    </Button>
  );
}
