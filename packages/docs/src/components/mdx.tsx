import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";
import { Step, Steps } from "./steps";
import dynamic from "next/dynamic";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { pre, code } from "./mdx-code";

// Define your custom MDX components.
export const mdxComponents: MDXComponents = {
  // Override the default <a> element to use the next/link component.
  a: ({ href, children }) => <Link href={href ?? ""}>{children}</Link>,
  Link,
  // Code blocks
  pre,
  code,
  // Steps
  Steps,
  Step,
  // Alert
  Alert,
  AlertDescription,
  AlertTitle,
  // Button
  Button,
  // Icons
  MessageCircleWarningIcon: dynamic(
    dynamicIconImports["message-circle-warning"],
  ),
};
