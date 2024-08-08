import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import { Step, Steps } from "./steps";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import dynamic from "next/dynamic";
import dynamicIconImports from "lucide-react/dynamicIconImports";

// Define your custom MDX components.
export const mdxComponents: MDXComponents = {
  // Override the default <a> element to use the next/link component.
  a: ({ href, children }) => <Link href={href ?? ""}>{children}</Link>,
  // Steps
  Steps,
  Step,
  // Alert
  Alert,
  AlertDescription,
  AlertTitle,
  // Icons
  MessageCircleWarningIcon: dynamic(
    dynamicIconImports["message-circle-warning"],
  ),
};
