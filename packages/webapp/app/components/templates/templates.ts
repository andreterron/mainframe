export const baseTemplate = `
import { useMainframeCredentials } from "@mainframe-so/react";
import { env } from "./env.ts";

export default function DynamicApp(props) {
  const { data } = useMainframeCredentials({
    datasetId: "DATASET_ID_PLACEHOLDER",
    apiKey: env.API_KEY,
    args: [],
    API_URL_PLACEHOLDER
  }, async (creds) => {
    // Use credentials to do something here
    return null;
  });

  return (<>
    <h1>Hello world!!</h1>
    <pre>{JSON.stringify(data ?? null, null, 4)}</pre>
  </>);
}`;

export const areaTemplate = `
import { useMainframeCredentials } from "@mainframe-so/react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { env } from "./env.ts";

const chartData = [
  {
    week: "Week 1",
    closedIssues: 2,
  },
  {
    week: "Week 2",
    closedIssues: 5,
  },
  {
    week: "Week 3",
    closedIssues: 8,
  },
  {
    week: "Week 4",
    closedIssues: 14,
  },
];

export default function DynamicApp(props) {
  const { data } = useMainframeCredentials({
    datasetId: "DATASET_ID_PLACEHOLDER",
    apiKey: env.API_KEY,
    args: [],
    API_URL_PLACEHOLDER
  }, async (creds) => {
    // Use credentials to do something here
    return null;
  });

  return (<div style={{
    fontFamily: "system-ui, Arial, sans-serif",
    padding: "20px",
  }}>
    <p style={{ fontSize: "12px", color: "#020617", marginBottom: "0"}}>Repo: <strong>blue-core-app</strong></p>
    <h1 style={{ fontSize: "18px", color: "#020617", fontWeight: "600", marginTop: "4px"}}>Cumulative Issues Closed</h1>
    <p style={{ fontSize: "14px", color: "#64748b"}}>This is a sample area chart showing the cumulative number of Github issues closed during the current cycle.</p>
    <div style={{ paddingTop: "8px", fontSize: "12px" }}>
      <ResponsiveContainer width="100%" height={200} fill="#64748b">
        <AreaChart width={400} height={200} data={chartData}>
        <defs>
      <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8}/>
        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
      </linearGradient>
    </defs>
          <XAxis dataKey="week" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip cursor={false} contentStyle={{ borderRadius: "4px", borderColor: "#f8fafc"}} />
          <Area type="monotone" dataKey="closedIssues" stroke="#14b8a6" fill="url(#colorBar)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>);
}`;

export const templates = [
  {
    name: "Base Template",
    code: baseTemplate,
  },
  {
    name: "Area Chart",
    code: areaTemplate,
  },
];
