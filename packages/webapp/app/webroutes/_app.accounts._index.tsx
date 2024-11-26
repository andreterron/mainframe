import { PageHeader } from "../components/PageHeader";
import { Link } from "react-router-dom";
import { PageBreadcrumb } from "../components/PageBreadcrumb";
import { BreadcrumbItem, BreadcrumbPage } from "../components/ui/breadcrumb";
import { trpc } from "../lib/trpc_client";
import {
  ItemCard,
  ItemCardContent,
  ItemCardIcon,
  ItemCardSubtitle,
} from "../components/ItemCard";
import { datasetIcon } from "../lib/integrations/icons/datasetIcon";
import { Button } from "../components/ui/button";
import { SadPath } from "../components/SadPath";
import { LinkIcon } from "lucide-react";

export default function AccountsPage() {
  const { data: datasets, error, isLoading } = trpc.datasetsAll.useQuery();

  if (!datasets) {
    return <SadPath className="p-4" error={error} isLoading={isLoading} />;
  }

  return (
    <div className="flex flex-col items-start gap-4 pb-16">
      <PageHeader
        title={
          <span className="inline-flex items-center">
            <span>Accounts</span>
          </span>
        }
        breadcrumb={
          <PageBreadcrumb>
            <BreadcrumbItem>
              <BreadcrumbPage>Accounts</BreadcrumbPage>
            </BreadcrumbItem>
          </PageBreadcrumb>
        }
      />
      <Link to="/accounts/new" className="mx-4">
        <Button>
          <LinkIcon className="size-4 mr-2" /> Connect new account
        </Button>
      </Link>
      <div className="p-4 gap-4 grid grid-cols-1 lg:grid-cols-2">
        {datasets?.map((dataset) => {
          const type = dataset.integrationType;
          const icon = type ? datasetIcon(type) : undefined;
          return (
            <ItemCard key={dataset.id} to={`/accounts/${dataset.id}`}>
              <ItemCardIcon>
                {icon ? (
                  <img
                    className="relative h-5 w-5 m-0.5 object-contain"
                    src={icon}
                  />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    className="relative humbleicons hi-layers h-5 w-5 m-0.5"
                  >
                    <g
                      xmlns="http://www.w3.org/2000/svg"
                      stroke="currentColor"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    >
                      <path d="M4 8l8-4 8 4-8 4-8-4z" />
                      <path
                        strokeLinecap="round"
                        d="M4 12l8 4 8-4M4 16l8 4 8-4"
                      />
                    </g>
                  </svg>
                )}
              </ItemCardIcon>
              <ItemCardContent>
                <span>{dataset.name}</span>
                <ItemCardSubtitle>
                  {/* TODO: Replace by their email or username */}
                  <span className="font-mono">
                    {dataset.id.slice(0, 4)}
                    <span className="font-sans">…</span>
                    {dataset.id.slice(-4)}
                  </span>
                </ItemCardSubtitle>
              </ItemCardContent>
            </ItemCard>
          );
        })}
      </div>
    </div>
  );
}
