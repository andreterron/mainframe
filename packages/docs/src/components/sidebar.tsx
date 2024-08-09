"use client";

import { sections } from "./posts";
import Link from "next/link";
import { cn } from "../lib/utils";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { useMediaQuery } from "../lib/use-media-query";
import { SheetClose, SheetContent } from "./ui/sheet";
import { useMemo } from "react";
import { allPosts } from "contentlayer/generated";

function SidebarContent() {
  const pathname = usePathname();

  const activePost = useMemo(
    () => allPosts.find((page) => page.url === pathname),
    [pathname],
  );

  return (
    <div className="w-72 py-8 flex flex-col gap-1">
      {sections.map((section) => {
        return (
          <div key={section.name} className="mb-6">
            <p className="text-xs uppercase font-bold px-4 mb-2">
              {section.name}
            </p>
            <div className="flex flex-col gap-1">
              {section.pages.map((post) => {
                return (
                  <SheetClose key={post._id} asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full px-4 py-1 text-start justify-start transition-none",
                        pathname === post.url ||
                          activePost?.highlight === post.url
                          ? "!text-primary !bg-primary/10 dark:!bg-primary/20"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                      asChild
                    >
                      <Link href={post.url}>{post.title}</Link>
                    </Button>
                  </SheetClose>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Sidebar() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  if (isDesktop) {
    // TODO: Review how the sidebar is positioned and scrolled. I'm suspicious
    // of these classes: sticky top-[73px] max-h-[calc(100vh-73px)]
    return (
      <div className="grow-0 sticky top-[73px] self-start overflow-auto max-h-[calc(100vh-73px)] shrink-0 px-4">
        <SidebarContent />
      </div>
    );
  }

  return (
    <SheetContent
      side="left"
      className="data-[state=closed]:duration-150 data-[state=open]:duration-300"
    >
      <SidebarContent />
    </SheetContent>
  );
}
