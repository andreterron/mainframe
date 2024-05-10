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

export const positiveNegativeTemplate = `
import { useMainframeCredentials } from "@mainframe-so/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from "recharts";
import { env } from "./env.ts";

const chartData = [
  {
    week: "Week 1",
    linesAdded: 100,
    linesDeleted: -200,
  },
  {
    week: "Week 2",
    linesAdded: 84,
    linesDeleted: -34,
  },
  {
    week: "Week 3",
    linesAdded: 126,
    linesDeleted: -119,
  },
  {
    week: "Week 4",
    linesAdded: 53,
    linesDeleted: -83,
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
    <div style={{ paddingTop: "8px", fontSize: "12px" }}>
      <ResponsiveContainer width="100%" height={200} fill="#64748b">
        <BarChart width={400} height={200} data={chartData} barCategoryGap='15%' barGap='0'>
        <defs>
      <linearGradient id="positiveColorBar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8}/>
        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.4}/>
      </linearGradient>
      <linearGradient id="negativeColorBar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.8}/>
      </linearGradient>
    </defs>
          <XAxis dataKey="week" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip cursor={false} contentStyle={{ borderRadius: "4px", borderColor: "#f8fafc"}} />
          <Bar dataKey="linesAdded" fill="url(#positiveColorBar)" radius={[4, 4, 2, 2]} />
          <Bar dataKey="linesDeleted" fill="url(#negativeColorBar)" radius={[4, 4, 2, 2]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>);
}`;

export const positiveNegativeComposedTemplate = `
import { useMainframeCredentials } from "@mainframe-so/react";
import { ComposedChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from "recharts";
import { env } from "./env.ts";

const chartData = [
  {
    week: "Week 1",
    linesAdded: 100,
    linesDeleted: -120,
    combined: 100 - 120,
  },
  {
    week: "Week 2",
    linesAdded: 84,
    linesDeleted: -34,
    combined: (100 - 120) + (84 - 34),
  },
  {
    week: "Week 3",
    linesAdded: 86,
    linesDeleted: -119,
    combined: (100 - 120) + (84 - 34) + (86 - 119),
  },
  {
    week: "Week 4",
    linesAdded: 53,
    linesDeleted: -83,
    combined: (100 - 120) + (84 - 34) + (86 - 119) + (53 - 83),
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
    <h1 style={{fontSize: "14px"}}>Lines Added/Deleted w/ Cumulative Total</h1>
    <div style={{ paddingTop: "8px", fontSize: "12px" }}>
      <ResponsiveContainer width="100%" height={200} fill="#64748b">
        <ComposedChart width={400} height={200} data={chartData} barCategoryGap='15%' barGap='0'>
        <defs>
      <linearGradient id="positiveColorBar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8}/>
        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.4}/>
      </linearGradient>
      <linearGradient id="negativeColorBar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.8}/>
      </linearGradient>
      <linearGradient id="posNegColor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#14b8a6" stopOpacity={1}/>
        <stop offset="95%" stopColor="#f43f5e" stopOpacity={1}/>
      </linearGradient>
    </defs>
          <XAxis dataKey="week" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip cursor={false} contentStyle={{ borderRadius: "4px", borderColor: "#f8fafc"}} />
          <Bar dataKey="linesAdded" fill="url(#positiveColorBar)" radius={[4, 4, 2, 2]} />
          <Bar dataKey="linesDeleted" fill="url(#negativeColorBar)" radius={[4, 4, 2, 2]} />
          <Line type="monotone" dataKey="combined" stroke="url(#posNegColor)" strokeWidth={2} dot={false} />  
        </ComposedChart>
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
