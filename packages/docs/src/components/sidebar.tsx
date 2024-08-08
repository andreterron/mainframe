"use client";

import { sections } from "./posts";
import Link from "next/link";
import { cn } from "../lib/utils";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-72 grow-0 px-4 py-8 flex flex-col gap-1 sticky top-0 self-start">
      {sections.map((section) => {
        return (
          <div key={section.name} className="mb-6">
            <p className="text-xs uppercase font-bold px-4 mb-2">
              {section.name}
            </p>
            <div className="flex flex-col gap-1">
              {section.pages.map((post) => {
                return (
                  <Button
                    key={post._id}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full px-4 py-1 text-start justify-start",
                      pathname === post.url
                        ? "text-accent-foreground bg-accent"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    asChild
                  >
                    <Link href={post.url}>{post.title}</Link>
                  </Button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
