import { memo, useCallback, useState } from "react";
import { Card } from "./ui/card";
import CodeMirror, { ViewUpdate } from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import "../codemirror.css";
import { tomorrow } from "thememirror";
import { Button } from "./ui/button";
import { PlayIcon, PlusSquareIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useComponentPreview } from "./ComponentPreview";
import { trpc } from "../lib/trpc_client";

export const WebStandardsPlaygroundTab = memo(function ({
  appTsxCode,
  componentId,
}: {
  appTsxCode: string;
  componentId?: string;
}) {
  const navigate = useNavigate();
  const [savedCode, setSavedCode] = useState(appTsxCode);

  const { code, setCode, codeRef, iframe, run, dirty } =
    useComponentPreview(appTsxCode);

  const addComponentToDashboard = trpc.addComponentToDashboard.useMutation();
  const updateComponent = trpc.updateComponent.useMutation();

  const handleChange = useCallback(
    (value: string, _viewUpdate: ViewUpdate) => {
      setCode(value);
    },
    [setCode],
  );

  async function handleSaveComponent() {
    const code = codeRef.current;
    if (!componentId) {
      const component = await addComponentToDashboard.mutateAsync({
        code,
      });
      navigate(`/dashboard/${component.id}`);
    } else {
      await updateComponent.mutateAsync({
        id: componentId,
        code,
      });
      setSavedCode(code);
    }
  }

  // TODO: Mobile UI
  return (
    <>
      <Card className="grid grid-cols-2 grid-rows-1 h-[480px] divide-x">
        <CodeMirror
          className="font-mono rounded-l-lg overflow-hidden playground"
          value={code}
          height="100%"
          extensions={[javascript({ jsx: true, typescript: true })]}
          onChange={handleChange}
          basicSetup={{
            foldGutter: false,
            lineNumbers: false,
            autocompletion: false,
            highlightActiveLine: false,
          }}
          theme={tomorrow}
        />

        <div className="flex flex-col">
          <div className="shrink-0 grow-0 border-b p-1 flex items-center text-muted-foreground">
            <Button
              variant={dirty ? "default" : "secondary"}
              size="xs"
              className="text-xs"
              onClick={() => {
                run();
              }}
            >
              <PlayIcon className="w-3 h-3 mr-1" />
              Run
            </Button>
            <div className="flex-1" />
            <Button
              variant={
                componentId && !dirty && code !== savedCode
                  ? "default"
                  : "ghost"
              }
              size="xs"
              className="text-xs"
              onClick={handleSaveComponent}
            >
              {!componentId ? (
                <>
                  <PlusSquareIcon className="w-3 h-3 mr-1" />
                  Add to dashboard
                </>
              ) : (
                <>Save</>
              )}
            </Button>
          </div>
          {iframe}
        </div>
      </Card>

      {/* <pre>{output}</pre> */}
    </>
  );
});
