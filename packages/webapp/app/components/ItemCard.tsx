import { PropsWithChildren } from "react";
import { Link, To } from "react-router-dom";
import { cn } from "../lib/utils";
import { ChevronRightIcon } from "lucide-react";

export function ItemCard({
  className,
  children,
  to,
  chevron = true,
}: PropsWithChildren<{
  className?: string;
  to: To;
  chevron?: boolean;
}>) {
  return (
    <Link
      className={cn(
        "border flex items-center w-80 h-16 rounded-lg shadow px-3 text-sm font-semibold py-3 hover:bg-accent transition",
        className,
      )}
      to={to}
    >
      {children}
      {chevron && (
        <ChevronRightIcon className="w-4 h-4 text-muted-foreground/40 ml-auto" />
      )}
    </Link>
  );
}

export function ItemCardIcon({
  className,
  children,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn(`flex items-center justify-center p-2 mr-2`, className)}>
      {children}
    </div>
  );
}

export function ItemCardContent({
  className,
  children,
}: PropsWithChildren<{
  className?: string;
}>) {
  return <div className={cn(`flex flex-col`, className)}>{children}</div>;
}

export function ItemCardSubtitle({
  className,
  children,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("text-muted-foreground text-xs font-normal", className)}>
      {children}
    </div>
  );
}
