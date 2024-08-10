import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import jsx from "react-syntax-highlighter/dist/esm/languages/prism/jsx";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import ts from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import js from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import codeStyle from "react-syntax-highlighter/dist/esm/styles/prism/atom-dark";
import { cn } from "../lib/utils";
import colors from "tailwindcss/colors";
import { DetailedHTMLProps, HTMLAttributes } from "react";

// Supported languages
SyntaxHighlighter.registerLanguage("jsx", jsx);
SyntaxHighlighter.registerLanguage("tsx", tsx);
SyntaxHighlighter.registerLanguage("js", js);
SyntaxHighlighter.registerLanguage("ts", ts);
SyntaxHighlighter.registerLanguage("bash", bash);

const lineStyle: React.CSSProperties | undefined = {
  width: "100%",
  display: "block",
  padding: "0 1rem",
};

const highlightedLineStyle: React.CSSProperties | undefined = {
  ...lineStyle,
  backgroundColor: `${colors.slate[600]}66`,
};

function prepareLineRanges(
  linesString: string | undefined,
): (lineNum: number) => boolean {
  if (!linesString) {
    return () => false;
  }

  // Split the input string by commas to get individual ranges or line numbers
  const ranges = linesString.split(",").map((range) => {
    const [start, end] = range.split("-").map(Number);
    return { start, end: end ?? start }; // Handle single line case (no dash)
  });

  return (lineNum: number) => {
    return ranges.some(({ start, end }) => lineNum >= start && lineNum <= end);
  };
}

export const pre = (
  props: DetailedHTMLProps<HTMLAttributes<HTMLPreElement>, HTMLPreElement>,
) => {
  return <pre {...props} className={cn(props.className, "px-0 py-2")} />;
};

export const code = ({
  className,
  ref,
  style,
  children,
  ...properties
}: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>) => {
  console.log("className", className);
  const match = /language-(\w+)(?:\{([-\d,]+)\})?/.exec(className || "");
  const lines = match?.[2];
  const lineRangeChecker = prepareLineRanges(lines);
  return match && typeof children === "string" ? (
    <SyntaxHighlighter
      customStyle={{
        ...style,
        background: "transparent",
        padding: "0",
      }}
      style={codeStyle}
      className={cn(className, "[&_*]:!no-underline")}
      language={match[1]}
      PreTag="div"
      wrapLines={true}
      showLineNumbers={true}
      lineNumberStyle={{ display: "none" }}
      lineProps={(lineNumber) => {
        if (lineRangeChecker(lineNumber)) {
          return { style: highlightedLineStyle };
        }
        return { style: lineStyle };
      }}
      {...properties}
    >
      {children}
    </SyntaxHighlighter>
  ) : (
    <code className={className} {...properties}>
      {children}
    </code>
  );
};
