import { ComponentProps } from "react";
import { cn } from "../../lib/utils";

export function HomeIcon({ className, ...props }: ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
      {...props}
      className={cn("humbleicons hi-home", className)}
    >
      <path
        xmlns="http://www.w3.org/2000/svg"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 10v9a1 1 0 001 1h10a1 1 0 001-1v-9M6 10l6-6 6 6M6 10l-2 2m14-2l2 2m-10"
      />
    </svg>
  );
}
