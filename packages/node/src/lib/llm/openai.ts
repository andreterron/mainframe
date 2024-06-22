import { env } from "../env.server";
import jsonToTS from "json-to-ts";
import { once } from "lodash-es";
import { readFile } from "node:fs/promises";
import OpenAI from "openai";
import { __dirnameFromImportMetaUrl } from "../../utils/dirname";
import { resolve } from "node:path";

const __dirname = __dirnameFromImportMetaUrl(import.meta.url);

const readSystemPromptTemplate = once(async () => {
  return await readFile(
    resolve(__dirname, "component_gen.sys.prompt.txt"),
    "utf8",
  );
});

export function generateTableComponent(
  prompt: string,
  tableId: string,
  data: any,
) {
  const dataHooks = `const { data } = useMainframeTable({
    tableId: "${tableId}",
    apiKey: env.API_KEY,
  ${
    env.VITE_API_URL === "https://api.mainframe.so"
      ? ""
      : `  apiUrl: "${env.VITE_API_URL}",\n  `
  }});`;

  return generateComponent(prompt, dataHooks, "useMainframeTable", data);
}

export function generateObjectComponent(
  prompt: string,
  datasetId: string,
  objectType: string,
  data: any,
) {
  const dataHooks = `  const { data } = useMainframeObject({
    datasetId: "${datasetId}",
    objectType: "${objectType}",
    apiKey: env.API_KEY,
  ${
    env.VITE_API_URL === "https://api.mainframe.so"
      ? ""
      : `  apiUrl: "${env.VITE_API_URL}",\n  `
  }});`;

  return generateComponent(prompt, dataHooks, "useMainframeObject", data.data);
}

export function generateCredentialComponent(
  prompt: string,
  datasetId: string,
  data: any,
) {
  const dataHooks = `  const { data } = useMainframeCredentials({
    datasetId: "${datasetId}",
    apiKey: env.API_KEY,
    args: [],
  ${
    env.VITE_API_URL === "https://api.mainframe.so"
      ? ""
      : `  apiUrl: "${env.VITE_API_URL}",\n  `
  }}, async (creds) => {
    // Use credentials to do something here
    return null;
  });`;

  return generateComponent(prompt, dataHooks, "useMainframeCredentials", data);
}

export async function generateComponent(
  prompt: string,
  dataHooks: string,
  mainframeImports: string,
  data: any,
) {
  const interfaces = jsonToTS(data).join("\n");

  const systemPromptTemplate = await readSystemPromptTemplate();

  const systemPrompt = systemPromptTemplate
    .replace("$IMPORTS", dataHooks)
    .replace("$DATA_HOOK", mainframeImports)
    .replace("$INTERFACES", interfaces);

  const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY, // This is the default and can be omitted
  });

  const chatCompletion = await openai.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Display the raw JSON of the data" },
      {
        role: "assistant",
        content: `import { ${mainframeImports} } from "@mainframe-so/react";
import { env } from "./env.ts";

export default function App(): JSX.Element {
  ${dataHooks}

  return (<div>
    <pre>{JSON.stringify(data ?? null, null, 4)}</pre>
  </div>);
}`,
      },
      { role: "user", content: prompt },
    ],
    model: "gpt-4o",
  });

  let response = chatCompletion.choices[0]?.message.content ?? "";

  const tripleQuotes = Array.from(response.matchAll(/```/g));
  if (tripleQuotes.length > 0) {
    console.log("AI responded with triple quotes:");
    console.log(response);
    let largestCodeBlock: string | undefined;
    for (let i = 0; i < Math.floor(tripleQuotes.length / 2) * 2; i++) {
      const a = tripleQuotes[i]?.index;
      const b = tripleQuotes[i + 1]?.index;
      if (a === undefined || b === undefined) {
        break;
      }
      const codeblock = response
        .substring(a, b)
        .replace(/^.*```.*\n/, "")
        .replace(/```.*$/, "")
        .trim();
      if (codeblock.length > (largestCodeBlock?.length ?? 0)) {
        largestCodeBlock = codeblock;
      }
    }
    if (largestCodeBlock) {
      return largestCodeBlock;
    }
  }

  return response;
}
