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

const lineStyle: React.CSSProperties | undefined = {
  width: "100%",
  display: "block",
  padding: "0 1rem",
};

const highlightedLineStyle: React.CSSProperties | undefined = {
  ...lineStyle,
  backgroundColor: `${colors.blue[700]}66`,
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
        <h2 className="font-bold text-lg">Create project</h2>
      </div>

      <SyntaxHighlighter
        customStyle={{ ...customStyle, padding: "1rem" }}
        language={"bash"}
        style={codeStyle}
      >
        npm create vite@latest
      </SyntaxHighlighter>
      {/* TODO: Copy button */}
      <div className="flex gap-2 items-center !mt-10">
        <div className="size-8 bg-secondary border rounded-full flex items-center justify-center">
          2
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
          3
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
          if ((lineNumber >= 7 && lineNumber <= 11) || lineNumber === 13) {
            return { style: highlightedLineStyle };
          }
          return { style: lineStyle };
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
          4
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
          if (lineNumber === 11 || lineNumber === 5) {
            return { style: highlightedLineStyle };
          }
          return { style: lineStyle };
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

      <div className="flex gap-2 items-center !mt-10">
        <div className="size-8 bg-secondary border rounded-full flex items-center justify-center">
          5
        </div>
        <h2 className="font-bold text-lg">Access APIs</h2>
      </div>

      <SyntaxHighlighter
        customStyle={customStyle}
        language={"tsx"}
        style={codeStyle}
        wrapLines={true}
        showLineNumbers={true}
        lineNumberStyle={{ display: "none" }}
        lineProps={(lineNumber) => {
          if ((lineNumber >= 6 && lineNumber <= 20) || lineNumber === 24) {
            return { style: highlightedLineStyle };
          }
          return { style: lineStyle };
        }}
      >
        {`// Home.tsx
import { useMainframeClient, useConnetions, useProxyGetter } from "@mainframe-api/react";

export function HomePage() {
  const mainframe = useMainframeClient();
  cosnt { data: connections } = useConnetions();

  const { data: githubUser } = useProxyGetter(
    connections?.find((c) => c.connected && c.provider === "github"),
    async (c) => {
      const res = await c.proxyFetch("/user");

      if (!res.ok) {
        console.error(await res.text());
        return;
      }

      return res.json();
    }
  );

  return (
    <div>
      {githubUser && <p>Connected as @{githubUser.login}</p>}
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
