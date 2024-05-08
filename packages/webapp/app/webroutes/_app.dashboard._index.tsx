import { PageHeader } from "../components/PageHeader";
import { trpc } from "../lib/trpc_client";

import { Link } from "react-router-dom";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { useComponentPreview } from "../components/useComponentPreview";
import { SquareCode } from "lucide-react";
import { Button } from "~/components/ui/button";

export function ComponentCard({
  component,
}: {
  component: { id: string; code: string };
}) {
  const { iframe } = useComponentPreview(component.code);

  return (
    <Card className="h-72 overflow-hidden">
      <CardHeader className="space-y-0 px-4 py-2 border-b border-slate-200 ">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <CardTitle className="text-sm">Title</CardTitle>
            <CardDescription className="text-xs">Description</CardDescription>
          </div>
          <Link to={`/dashboard/${component.id}`}>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-8 w-8 text-slate-500"
              aria-label="Edit component"
            >
              <SquareCode className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      {iframe}
    </Card>
  );
}
export default function DashboardPage() {
  const { data: components } = trpc.getAllComponents.useQuery();

  return (
    <div className="flex flex-col items-start gap-4">
      <PageHeader title="Dashboard" />
      <div className="w-full grid md:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 px-4 max-w-[100rem]">
        {components?.map((component) => (
          <ComponentCard key={component.id} component={component} />
        ))}
      </div>
    </div>
  );
}
