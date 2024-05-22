import { memo, useCallback, useEffect, useState } from "react";
import { Card } from "./ui/card";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import "../codemirror.css";
import { tomorrow, coolGlow } from "thememirror";
import { Button } from "./ui/button";
import {
  PlayIcon,
  Moon,
  PlusSquareIcon,
  Sun,
  SparklesIcon,
  LoaderIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useComponentPreview } from "./useComponentPreview";
import { trpc } from "../lib/trpc_client";
import { atom, useAtom } from "jotai";
import { Prec } from "@codemirror/state";
import { keymap, ViewUpdate } from "@codemirror/view";
import { cn } from "../lib/utils";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { PreviewLabel } from "./PreviewLabel";
import { env } from "../lib/env_client";

// HACK: This is used to cache the code changes when switching between dataset tabs
export const codeAtom = atom("");

export const WebStandardsPlaygroundTab = memo(function ({
  appTsxCode,
  onGenerateCode,
  componentId,
}: {
  appTsxCode: string;
  onGenerateCode?: (prompt: string) => Promise<string | undefined>;
  componentId?: string;
}) {
  const { data: isAIEnabled } = trpc.isAIEnabled.useQuery(undefined, {
    initialData: !env.VITE_AUTH_PASS,
    refetchOnMount: true,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const [playgroundTheme, setPlaygroundTheme] = useState(() => {
    const savedThemeName = localStorage.getItem("playgroundTheme");
    return savedThemeName === "coolGlow" ? coolGlow : tomorrow;
  });
  const navigate = useNavigate();
  const [savedCode, setSavedCode] = useState(appTsxCode);

  const [codeCache, setCodeCache] = useAtom(codeAtom);

  const { code, setCode, codeRef, iframe, run, dirty } = useComponentPreview(
    codeCache || appTsxCode,
  );

  const [generating, setGenerating] = useState(false);

  async function generateCode(prompt: string) {
    if (!onGenerateCode || !prompt) {
      return;
    }
    setGenerating(true);
    try {
      const code = await onGenerateCode(prompt);

      if (!code) {
        return;
      }

      setCode(code);
      await run();
    } finally {
      setGenerating(false);
    }
  }

  const addComponentToDashboard = trpc.addComponentToDashboard.useMutation();
  const updateComponent = trpc.updateComponent.useMutation();

  const handleChange = useCallback(
    (value: string, _viewUpdate: ViewUpdate) => {
      setCode(value);
      setCodeCache(value);
    },
    [setCode],
  );

  const togglePlaygroundTheme = () => {
    setPlaygroundTheme(playgroundTheme === tomorrow ? coolGlow : tomorrow);
  };

  useEffect(() => {
    const playgroundThemeName =
      playgroundTheme === coolGlow ? "coolGlow" : "tomorrow";
    localStorage.setItem("playgroundTheme", playgroundThemeName);
  }, [playgroundTheme]);

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
      {isAIEnabled && onGenerateCode && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            generateCode(new FormData(e.target as any).get("prompt") as string);
          }}
        >
          <Label className="block mb-2">
            Generate a component using AI <PreviewLabel />
          </Label>
          <div className="flex items-center gap-2 mb-4 relative">
            <Input
              placeholder="Display a raw JSON of the data"
              name="prompt"
              className="pl-9"
            />
            <SparklesIcon className="absolute left-3 w-4 h-4 text-muted-foreground" />
            <Button variant="default" disabled={generating}>
              {generating && (
                <LoaderIcon className="animate-spin w-5 h-5 mr-1" />
              )}{" "}
              Generate
            </Button>
          </div>
        </form>
      )}
      <Card className="grid grid-cols-2 grid-rows-1 h-[480px] divide-x relative">
        <div className="relative">
          <Button
            className={cn(
              "absolute bottom-3 z-10 right-3 rounded-full w-6 h-6 opacity-85  hover:opacity-100",
              playgroundTheme === tomorrow
                ? "bg-slate-100 hover:bg-slate-200"
                : "bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white",
            )}
            variant="ghost"
            size="icon"
            onClick={togglePlaygroundTheme}
          >
            {playgroundTheme === tomorrow ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>
          <CodeMirror
            className="font-mono rounded-l-lg overflow-hidden h-full playground"
            value={code}
            height="100%"
            extensions={[
              javascript({ jsx: true, typescript: true }),
              Prec.highest(
                keymap.of([
                  {
                    key: "Mod-s",
                    run: () => {
                      run()?.then(() =>
                        componentId ? handleSaveComponent() : null,
                      );
                      return true;
                    },
                  },
                  {
                    key: "Mod-Enter",
                    run: () => {
                      run();
                      return true;
                    },
                  },
                ]),
              ),
            ]}
            onChange={handleChange}
            basicSetup={{
              foldGutter: false,
              lineNumbers: false,
              autocompletion: false,
              highlightActiveLine: false,
            }}
            theme={playgroundTheme}
          />
        </div>
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
