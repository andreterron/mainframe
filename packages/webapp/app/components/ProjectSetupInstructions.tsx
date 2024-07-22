import { PropsWithChildren } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import codeStyle from "react-syntax-highlighter/dist/esm/styles/prism/okaidia";
import colors from "tailwindcss/colors";

const customStyle: React.CSSProperties | undefined = {
  padding: "1rem 0",
  borderRadius: "0.25rem",
  // width: "720px",
  // maxHeight: "15rem",
  // background: "transparent",
  overflow: "auto",
};

export function ProjectSetupInstructions({
  appId,
  children,
}: PropsWithChildren<{ appId: string }>) {
  // TODO: Get inspiration from tailwind, shadcn and other dev tools setups
  // TODO: Ensure this is also in our docs

  return (
    <div className="w-[80ch] space-y-4">
      {/* TODO: Copy button */}
      <div className="flex gap-2 items-center">
        <div className="size-8 bg-secondary border rounded-full flex items-center justify-center">
          1
        </div>
        <h2 className="font-bold text-lg">Install Mainframe client</h2>
      </div>

      <SyntaxHighlighter
        customStyle={{ ...customStyle, padding: "1rem" }}
        language={"bash"}
        style={codeStyle}
      >
        npm i @mainframe-api/react
      </SyntaxHighlighter>
      <div className="flex gap-2 items-center !mt-10">
        <div className="size-8 bg-secondary border rounded-full flex items-center justify-center">
          2
        </div>
        <h2 className="font-bold text-lg">Add MainframeProvider</h2>
      </div>
      {/* TODO: Copy button */}
      {/* TODO: Syntax highlight */}

      <SyntaxHighlighter
        customStyle={customStyle}
        language={"tsx"}
        style={codeStyle}
        wrapLines={true}
        showLineNumbers={true}
        lineNumberStyle={{ display: "none" }}
        lineProps={(lineNumber) => {
          const style: React.CSSProperties | undefined = {
            width: "100%",
            display: "block",
            padding: "0 1rem",
          };
          if ((lineNumber >= 7 && lineNumber <= 11) || lineNumber === 13) {
            style.backgroundColor = `${colors.blue[700]}66`;
          }
          return { style };
        }}
      >
        {`// App.tsx
import { HomePage } from "./components/pages/Home";
import { MainframeProvider } from "@mainframe-api/react";

function App() {
  return (
    <MainframeProvider
      config={{
        appId: "${appId}",
      }}
    >
      <HomePage />
    </MainframeProvider>
  );
}

export default App;`}
      </SyntaxHighlighter>
      {/* <pre className="bg-black font-mono p-4 text-white rounded">
        
      </pre> */}
      <div className="flex gap-2 items-center !mt-10">
        <div className="size-8 bg-secondary border rounded-full flex items-center justify-center">
          3
        </div>
        <h2 className="font-bold text-lg">Initiate authentication</h2>
      </div>

      <SyntaxHighlighter
        customStyle={customStyle}
        language={"tsx"}
        style={codeStyle}
        wrapLines={true}
        showLineNumbers={true}
        lineNumberStyle={{ display: "none" }}
        lineProps={(lineNumber) => {
          const style: React.CSSProperties | undefined = {
            width: "100%",
            display: "block",
            padding: "0 1rem",
          };
          if (lineNumber === 11 || lineNumber === 5) {
            style.backgroundColor = `${colors.blue[700]}66`;
          }
          return { style };
        }}
      >
        {`// Home.tsx
import { useMainframeClient } from "@mainframe-api/react";

export function HomePage() {
  const mainframe = useMainframeClient();

  return (
    <div>
      <button
        onClick={() => {
          mainframe.initiateAuth("github");
        }}
      >
        GitHub
      </button>
    </div>
  );
}
`}
      </SyntaxHighlighter>
      {children}
    </div>
  );
}
