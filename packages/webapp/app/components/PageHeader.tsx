import { PropsWithChildren, ReactNode } from "react";
import { cn } from "../lib/utils";

export const headerButtonClassName =
  "grow-0 shrink-0 p-2 rounded hover:bg-gray-200";

export function PageHeader({
  children,
  title,
  breadcrumb,
  className,
}: PropsWithChildren<{
  title?: ReactNode;
  breadcrumb?: ReactNode;
  className?: string;
}>) {
  return (
    <div className={cn("flex w-full items-center p-4", className)}>
      <div className="flex flex-col gap-2 flex-1 min-h-[2.5rem]">
        {breadcrumb}
        <h1 className="text-2xl font-medium">{title}</h1>
      </div>
      <div className="grow-0 shrink-0 flex gap-1 items-center">{children}</div>
    </div>
  );
}
