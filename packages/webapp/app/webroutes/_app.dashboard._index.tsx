import { PageHeader } from "../components/PageHeader";
import { trpc } from "../lib/trpc_client";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";
import { useComponentPreview } from "../components/useComponentPreview";
import { Button } from "~/components/ui/button";
import { SadPath } from "../components/SadPath";
import { useEffect } from "react";

export function ComponentCard({
  component,
}: {
  component: { id: string; code: string };
}) {
  const { iframe } = useComponentPreview(component.code, {
    disableScrolling: true,
  });

  return (
    <div className="group">
      <div className="flex justify-end w-full opacity-0 group-hover:opacity-75 focus-within:opacity-75 transition-all px-2 mb-1">
        <Button asChild variant="ghost" size="none" className="py-px px-1.5">
          <Link
            to={`/dashboard/${component.id}`}
            className="text-xs text-muted-foreground hover:bg-active"
          >
            Edit
          </Link>
        </Button>
      </div>
      <Card className="h-72 overflow-hidden relative">{iframe}</Card>
    </div>
  );
}
export default function DashboardPage() {
  const {
    data: components,
    isLoading,
    error,
  } = trpc.getAllComponents.useQuery();
  const navigate = useNavigate();

  useEffect(() => {
    if (components?.length === 0) {
      navigate("/");
    }
  }, [components?.length]);

  if (!components) {
    return <SadPath className="p-4" error={error} isLoading={isLoading} />;
  }

  return (
    <div className="flex flex-col items-start gap-4 pb-16">
      <PageHeader title="Dashboard" />
      <div className="w-full grid md:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-x-4 gap-y-3 px-4 max-w-[100rem]">
        {components.length === 0 ? (
          <div>
            <h3 className="text-lg mb-4 font-medium">No saved components</h3>
            <p className="prose">
              To save a component:
              <ol>
                <li>
                  Navigate to a dataset or{" "}
                  <Link to="/new" className="">
                    create a new one
                  </Link>
                </li>
                <li>Choose an object or table</li>
                <li>Open the playground</li>
                <li>Click "Add to dashboard"</li>
              </ol>
            </p>
            <p className="prose font-light text-sm text-muted-foreground mt-4">
              *You'll soon be able to create components from this screen
            </p>
          </div>
        ) : (
          components.map((component) => (
            <ComponentCard key={component.id} component={component} />
          ))
        )}
      </div>
    </div>
  );
}
