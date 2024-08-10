"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button, ButtonVariantProps } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeSubmenu() {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="">
        <Sun className="size-4 mr-2 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute size-4 mr-2 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span>Theme</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuCheckboxItem
          checked={theme === "light"}
          onClick={() => setTheme("light")}
        >
          Light
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={theme === "dark"}
          onClick={() => setTheme("dark")}
        >
          Dark
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={theme === "system"}
          onClick={() => setTheme("system")}
        >
          System
        </DropdownMenuCheckboxItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

export function ThemeToggle(props: ButtonVariantProps & { className: string }) {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button {...props}>
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuCheckboxItem
          checked={theme === "light"}
          onClick={() => setTheme("light")}
        >
          Light
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={theme === "dark"}
          onClick={() => setTheme("dark")}
        >
          Dark
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={theme === "system"}
          onClick={() => setTheme("system")}
        >
          System
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
