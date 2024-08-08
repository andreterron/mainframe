import { PropsWithChildren } from "react";
import { cn } from "../lib/utils";
import "./steps.css";

export function Steps({ children }: PropsWithChildren<{}>) {
  return (
    <div className="steps mb-12 ml-4 pl-8 [counter-reset:step]">{children}</div>
  );
}

export function Step({
  children,
  title,
}: PropsWithChildren<{ title: string }>) {
  return (
    <div className={cn("relative step pb-8 mb-2")}>
      <h3
        className={cn(
          "font-heading scroll-m-20 text-xl font-semibold tracking-tight h-8 flex items-center my-0",
        )}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}
