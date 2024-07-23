import { PropsWithChildren, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import codeStyle from "react-syntax-highlighter/dist/esm/styles/prism/atom-dark";
import colors from "tailwindcss/colors";

const customStyle: React.CSSProperties | undefined = {
  margin: "1rem 0 0 2.5rem",
  padding: "1rem 0",
  borderRadius: "0.5rem",
  border: "1px solid #27272a",
  // width: "720px",
  // maxHeight: "15rem",
  // background: "transparent",
  overflow: "auto",
  fontSize: "0.825rem",
};

const lineStyle: React.CSSProperties | undefined = {
  width: "100%",
  display: "block",
  padding: "0 1rem",
};

const highlightedLineStyle: React.CSSProperties | undefined = {
  ...lineStyle,
  backgroundColor: `${colors.slate[600]}66`,
};

export function ProjectSetupInstructions({
  appId,
  children,
}: PropsWithChildren<{ appId: string }>) {
  // TODO: Get inspiration from tailwind, shadcn and other dev tools setups
  // TODO: Ensure this is also in our docs

  const [activeSection, setActiveSection] = useState<string>("create-project");

  return (
    <div className="flex gap-10 2xl:gap-20">
      <div className="w-2/3 max-w-[80ch] space-y-4">
        {/* TODO: Copy button */}
        {/* TODO: Switch between npm, yarn, pnpm, bun */}
        <div className="flex gap-2 items-center">
          <div className="size-8 bg-secondary border rounded-full flex items-center justify-center">
            1
          </div>
          <h2 id="create-project" className="font-bold text-lg">
            Create project
          </h2>
        </div>
        <p className="ml-10 text-sm text-slate-600">
          Start by creating a new Vite project if you don’t have one set up
          already. The most common approach is to by using the Create Vite
          terminal command.
        </p>

        <SyntaxHighlighter
          customStyle={{ ...customStyle, padding: "1rem" }}
          language={"bash"}
          style={codeStyle}
        >
          npm create vite@latest -- --template react-ts
        </SyntaxHighlighter>
        {/* TODO: Copy button */}
        <div className="flex gap-2 items-center !mt-10">
          <div className="size-8 bg-secondary border rounded-full flex items-center justify-center">
            2
          </div>
          <h2 id="install-mainframe-client" className="font-bold text-lg">
            Install Mainframe client
          </h2>
        </div>
        <p className="ml-10 text-sm text-slate-600">
          Install the Mainframe client package. This package provides the
          necessary tools to use Mainframe within your application.
        </p>

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
          <h2 id="add-mainframe-provider" className="font-bold text-lg">
            Add MainframeProvider
          </h2>
        </div>
        <p className="ml-10 text-sm text-slate-600">
          Wrap your root component with{" "}
          <code className="text-primary font-medium bg-secondary rounded-sm py-[1px] px-1">
            `MainframeProvider`
          </code>
          . This provider requires an{" "}
          <code className="text-primary font-medium bg-secondary rounded-sm py-[1px] px-1">
            `appId`
          </code>{" "}
          which you can obtain from your Mainframe project ID. Update your{" "}
          <code className="text-primary font-medium bg-secondary rounded-sm py-[1px] px-1">
            `main.tsx`
          </code>{" "}
          file as follows:
        </p>
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
            if (lineNumber == 6 || lineNumber == 10 || lineNumber === 12) {
              return { style: highlightedLineStyle };
            }
            return { style: lineStyle };
          }}
        >
          {`// main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { MainframeProvider } from "@mainframe-api/react"

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MainframeProvider appId="${appId}">
      <App />
    </MainframeProvider>
  </React.StrictMode>,
)`}
        </SyntaxHighlighter>
        {/* <pre className="bg-black font-mono p-4 text-white rounded">
        
      </pre> */}
        <div className="flex gap-2 items-center !mt-10">
          <div className="size-8 bg-secondary border rounded-full flex items-center justify-center">
            4
          </div>
          <h2 id="initiate-authentication" className="font-bold text-lg">
            Initiate authentication
          </h2>
        </div>
        <p className="ml-10 text-sm text-slate-600">
          Add a button to initiate authentication to your desired data provider.
          This will open an OAuth connection allowing users to authenticate
          their accounts. This example demonstrates how to add a button to
          connect to GitHub using OAuth.
        </p>

        <SyntaxHighlighter
          customStyle={customStyle}
          language={"tsx"}
          style={codeStyle}
          wrapLines={true}
          showLineNumbers={true}
          lineNumberStyle={{ display: "none" }}
          lineProps={(lineNumber) => {
            if (lineNumber === 6 || lineNumber === 11) {
              return { style: highlightedLineStyle };
            }
            return { style: lineStyle };
          }}
        >
          {`// App.tsx
import { useMainframeClient } from "@mainframe-api/react";
import './App.css'

function App() {
  const mainframe = useMainframeClient();

  return (
    <>
      <h1>Mainframe</h1>
      <button onClick={() => mainframe.initiateAuth("github")}>
        Connect to GitHub
      </button>
    </>
  )
}

export default App
`}
        </SyntaxHighlighter>

        <div className="flex gap-2 items-center !mt-10">
          <div className="size-8 bg-secondary border rounded-full flex items-center justify-center">
            5
          </div>
          <h2 id="access-apis" className="font-bold text-lg">
            Access APIs
          </h2>
        </div>
        <p className="ml-10 text-sm text-slate-600 ">
          Use the{" "}
          <code className="text-primary font-medium bg-secondary rounded-sm py-[1px] px-1">
            `useConnections`
          </code>{" "}
          hook to access authenticated connections and the{" "}
          <code className="text-primary font-medium bg-secondary rounded-sm py-[1px] px-1">
            `useProxyGetter`
          </code>{" "}
          hook to fetch data from the API. This example shows how to fetch the
          authenticated user's data from GitHub.
        </p>

        <SyntaxHighlighter
          customStyle={customStyle}
          language={"tsx"}
          style={codeStyle}
          wrapLines={true}
          showLineNumbers={true}
          lineNumberStyle={{ display: "none" }}
          lineProps={(lineNumber) => {
            if ((lineNumber >= 7 && lineNumber <= 22) || lineNumber === 27) {
              return { style: highlightedLineStyle };
            }
            return { style: lineStyle };
          }}
        >
          {`// App.tsx
import { useMainframeClient, useConnections, useProxyGetter } from "@mainframe-api/react";
import './App.css'

function App() {
  const mainframe = useMainframeClient();
  const { data: connections } = useConnections();

  const { data: githubUser } = useProxyGetter(
    connections?.find((c) => c.connected && c.provider === "github"),
    async (c) => {
      // This makes a request to the GitHub API through a Mainframe proxy
      const res = await c.proxyFetch("/user");

      if (!res.ok) {
        console.error(await res.text());
        return;
      }

      return res.json();
    }
  );

  return (
    <>
      <h1>Mainframe</h1>
      {githubUser && <p>Connected as @{githubUser.login}</p>}
      <button onClick={() => mainframe.initiateAuth("github")}>
        Connect to GitHub
      </button>
    </>
  )
}

export default App
`}
        </SyntaxHighlighter>
        {children}
      </div>
      <div className="text-sm text-slate-500 hidden lg:block">
        <ul className="sticky top-20 flex flex-col gap-2">
          <li className="text-primary font-bold mb-2">On this page</li>
          <li>
            <a
              onClick={(e) => {
                e.preventDefault();
                setActiveSection("create-project");
                const element = document.getElementById("create-project");
                if (element) {
                  element.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className={`hover:text-primary ${
                activeSection === "create-project" ? "text-primary" : ""
              }`}
              href="#create-project"
            >
              Create project
            </a>
          </li>
          <li>
            <a
              onClick={(e) => {
                e.preventDefault();
                setActiveSection("install-mainframe-client");
                const element = document.getElementById(
                  "install-mainframe-client",
                );
                if (element) {
                  element.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className={`hover:text-primary ${
                activeSection === "install-mainframe-client"
                  ? "text-primary"
                  : ""
              }`}
              href="#install-mainframe-client"
            >
              Install Mainframe client
            </a>
          </li>
          <li>
            <a
              onClick={(e) => {
                e.preventDefault();
                setActiveSection("add-mainframe-provider");
                const element = document.getElementById(
                  "add-mainframe-provider",
                );
                if (element) {
                  element.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className={`hover:text-primary ${
                activeSection === "add-mainframe-provider" ? "text-primary" : ""
              }`}
              href="#add-mainframe-provider"
            >
              Add MainframeProvider
            </a>
          </li>
          <li>
            <a
              onClick={(e) => {
                e.preventDefault();
                setActiveSection("initiate-authentication");
                const element = document.getElementById(
                  "initiate-authentication",
                );
                if (element) {
                  element.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className={`hover:text-primary ${
                activeSection === "initiate-authentication"
                  ? "text-primary"
                  : ""
              }`}
              href="#initiate-authentication"
            >
              Initiate authentication
            </a>
          </li>
          <li>
            <a
              onClick={(e) => {
                e.preventDefault();
                setActiveSection("access-apis");
                const element = document.getElementById("access-apis");
                if (element) {
                  element.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className={`hover:text-primary ${
                activeSection === "access-apis" ? "text-primary" : ""
              }`}
              href="#access-apis"
            >
              Access APIs
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
