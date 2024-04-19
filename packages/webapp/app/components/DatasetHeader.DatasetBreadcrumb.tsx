import { PropsWithChildren, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc_client";
import { Dataset } from "@mainframe-so/shared";
import { PageHeader } from "./PageHeader";
import { Button } from "./ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { HomeIcon } from "./icons/HomeIcon";

export function DatasetBreadcrumb({
  children,
  dataset,
}: PropsWithChildren<{
  dataset: Pick<Dataset, "id" | "name" | "integrationType">;
}>) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink to="/">
            <HomeIcon className="w-5 h-5" />
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          {children ? (
            <BreadcrumbLink to={`/dataset/${dataset.id}`}>
              {dataset.name}
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage>{dataset.name}</BreadcrumbPage>
          )}
        </BreadcrumbItem>
        {children}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
