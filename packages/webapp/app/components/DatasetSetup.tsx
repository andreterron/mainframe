import { Component, SheetIcon } from "lucide-react";
import { datasetIcon } from "../lib/integrations/icons/datasetIcon";
import { trpc } from "../lib/trpc_client";
import { PageHeader } from "./PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import TemplateCard from "./TemplateCard";

function IntegrationButton({
  name,
  type,
  onClick,
}: {
  name: string;
  type: string;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}) {
  const icon = type ? datasetIcon(type) : undefined;
  return (
    <button
      className="border shadow rounded-lg py-2 px-4 flex items-center gap-2"
      onClick={onClick}
    >
      {icon ? (
        <img className="relative h-4 w-4 m-0.5 object-contain" src={icon} />
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          className="relative humbleicons hi-layers h-4 w-4 m-0.5"
        >
          <g
            xmlns="http://www.w3.org/2000/svg"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="2"
          >
            <path d="M4 8l8-4 8 4-8 4-8-4z" />
            <path strokeLinecap="round" d="M4 12l8 4 8-4M4 16l8 4 8-4" />
          </g>
        </svg>
      )}
      <span>{name}</span>
    </button>
  );
}

export default function DatasetSetup({
  onIntegrationSelected,
}: {
  onIntegrationSelected: (type: string) => void;
}) {
  const { data: integrations } = trpc.integrationsAll.useQuery();
  console.log(integrations);
  return (
    <div className="flex flex-col items-start gap-4">
      <PageHeader title="New Dataset" />
      <Tabs defaultValue="components" className="flex flex-col w-full">
        <TabsList className="grid grid-cols-2 m-4 self-start">
          <TabsTrigger value="components">
            <Component className="w-3.5 h-3.5 mr-1" />
            Components
          </TabsTrigger>
          <TabsTrigger value="dataset">
            <SheetIcon className="w-3.5 h-3.5 mr-1" />
            Dataset
          </TabsTrigger>
        </TabsList>
        <TabsContent value="components">
          <div className="flex flex-wrap max-w-full overflow-auto px-4 gap-6 mt-4">
            <TemplateCard
              title="Repo Activity"
              description="A chart visualizing team or repo activity."
              imgSrc="https://ouch-cdn2.icons8.com/DlrLzA4-weIluOT-U-Zsvtia_P6Tr61Cf5eWT9rcWEA/rs:fit:368:534/czM6Ly9pY29uczgu/b3VjaC1wcm9kLmFz/c2V0cy9wbmcvODYz/L2Q2OTdhNDA0LTRl/YWYtNGIxYS04OGE0/LTI5ZGM5NmE4ZjFj/Ni5wbmc.png"
            />
            <TemplateCard
              title="Repo +/- Lines"
              description="A bar chart showing added/deleted lines of code."
              imgSrc="https://ouch-cdn2.icons8.com/DlrLzA4-weIluOT-U-Zsvtia_P6Tr61Cf5eWT9rcWEA/rs:fit:368:534/czM6Ly9pY29uczgu/b3VjaC1wcm9kLmFz/c2V0cy9wbmcvODYz/L2Q2OTdhNDA0LTRl/YWYtNGIxYS04OGE0/LTI5ZGM5NmE4ZjFj/Ni5wbmc.png"
            />
            <TemplateCard
              title="Issues Completed"
              description="A line graph showing cumulative issues completed throughout the month."
              imgSrc="https://ouch-cdn2.icons8.com/DlrLzA4-weIluOT-U-Zsvtia_P6Tr61Cf5eWT9rcWEA/rs:fit:368:534/czM6Ly9pY29uczgu/b3VjaC1wcm9kLmFz/c2V0cy9wbmcvODYz/L2Q2OTdhNDA0LTRl/YWYtNGIxYS04OGE0/LTI5ZGM5NmE4ZjFj/Ni5wbmc.png"
            />
            <TemplateCard
              title="Codebase Structure"
              description="A bubble chart to visualize the codebase structure of a repo."
              imgSrc="https://ouch-cdn2.icons8.com/DlrLzA4-weIluOT-U-Zsvtia_P6Tr61Cf5eWT9rcWEA/rs:fit:368:534/czM6Ly9pY29uczgu/b3VjaC1wcm9kLmFz/c2V0cy9wbmcvODYz/L2Q2OTdhNDA0LTRl/YWYtNGIxYS04OGE0/LTI5ZGM5NmE4ZjFj/Ni5wbmc.png"
            />
          </div>
        </TabsContent>
        <TabsContent value="dataset">
          <div className="w-full max-w-3xl grid md:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
            {(integrations ? Object.entries(integrations) : []).map(
              ([key, { name }]) => (
                <IntegrationButton
                  key={key}
                  name={name}
                  type={key}
                  onClick={() => onIntegrationSelected(key)}
                />
              ),
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
