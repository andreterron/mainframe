import { env } from "../env.server";
import jsonToTS from "json-to-ts";
import { once } from "lodash";
import { readFile } from "fs/promises";
import OpenAI from "openai";
import { __dirnameFromImportMetaUrl } from "../../utils/dirname";
import { resolve } from "path";

const __dirname = __dirnameFromImportMetaUrl(import.meta.url);

const readSystemPromptTemplate = once(async () => {
  return await readFile(
    resolve(__dirname, "component_gen.sys.prompt.txt"),
    "utf8",
  );
});

export async function generateComponent(
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
        : `apiUrl: "${env.VITE_API_URL}",\n  `
    }});`;

  const interfaces = jsonToTS(data).join("\n");

  const systemPromptTemplate = await readSystemPromptTemplate();

  const systemPrompt = systemPromptTemplate
    .replace("$DATA_HOOK", dataHooks)
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
        content: `import { useMainframeTable } from "@mainframe-so/react";
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

  let response = chatCompletion.choices[0].message.content ?? "";

  if (response.includes("```")) {
    response = response.replace(/^.*```.*\n/, "").replace(/```.*$/, "");
  }

  return response;
}
