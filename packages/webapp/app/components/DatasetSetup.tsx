import { datasetIcon } from "../lib/integrations/icons/datasetIcon";
import { trpc } from "../lib/trpc_client";
import { Dataset } from "../lib/types";
import { DatasetHeader } from "./DatasetHeader";

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
        <img className="relative h-4 w-4 m-0.5" src={icon} />
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
  dataset,
}: {
  onIntegrationSelected: (type: string) => void;
  dataset?: Dataset;
}) {
  const { data: integrations } = trpc.integrationsAll.useQuery();
  return (
    <div className="flex flex-col items-start gap-4">
      <DatasetHeader dataset={dataset}>Import</DatasetHeader>
      <div className="w-full max-w-3xl grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(integrations ? Object.entries(integrations) : []).map(
          ([key, { name }]) => (
            <IntegrationButton
              name={name}
              type={key}
              onClick={() => onIntegrationSelected(key)}
            />
          ),
        )}
      </div>
    </div>
  );
}
