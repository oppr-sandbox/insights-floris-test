"use client";

import { useMemo, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Play,
  RefreshCw,
  RotateCcw,
  KeyRound,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

const KNOWN_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

type Result = {
  status: "ok" | "fail";
  latencyMs?: number;
  httpStatus?: number;
  message?: string;
};

export function ModelsTab() {
  const config = useQuery(api.ai.modelConfig);
  const testModel = useAction(api.ai.testModel);
  const setInsightModel = useMutation(api.ai.setInsightModel);

  const [results, setResults] = useState<Record<string, Result>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [customModel, setCustomModel] = useState("");
  const [savingModel, setSavingModel] = useState(false);

  const selectableModels = useMemo(() => {
    const base = config ? [config.envDefault, config.fallback] : [];
    return Array.from(new Set([...base, ...KNOWN_MODELS]));
  }, [config]);

  const onSelectModel = async (value: string) => {
    setSavingModel(true);
    try {
      await setInsightModel({ model: value });
      toast.success("Active model updated", {
        description: value
          ? `Insights + chat will use ${value}.`
          : "Reverted to the environment default.",
      });
    } catch (e) {
      toast.error("Failed to update model", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setSavingModel(false);
    }
  };

  const models = useMemo(() => {
    const base = config ? [config.primary, config.fallback] : [];
    return Array.from(new Set([...base, ...KNOWN_MODELS]));
  }, [config]);

  const runTest = async (model: string) => {
    if (!model.trim()) return;
    setTesting((t) => ({ ...t, [model]: true }));
    try {
      const r = await testModel({ model });
      setResults((s) => ({
        ...s,
        [model]: {
          status: r.ok ? "ok" : "fail",
          latencyMs: r.latencyMs,
          httpStatus: r.httpStatus,
          message: r.ok ? r.sample || "OK" : r.error || "Failed",
        },
      }));
    } catch (e) {
      setResults((s) => ({
        ...s,
        [model]: {
          status: "fail",
          message: e instanceof Error ? e.message : String(e),
        },
      }));
    } finally {
      setTesting((t) => ({ ...t, [model]: false }));
    }
  };

  const runAll = () => models.forEach((m) => void runTest(m));
  const anyTesting = Object.values(testing).some(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={runAll} disabled={anyTesting || !config}>
          {anyTesting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Test all
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Cpu className="h-4 w-4" /> AI Model Configuration
          </CardTitle>
          <CardDescription>
            Insight generation uses the primary model and falls back to the
            fallback model when the primary is unavailable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!config ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Spinner /> Loading configuration…
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">
                    Active model — used by insight generation &amp; chat
                  </label>
                  <Select
                    value={config.primary}
                    onValueChange={onSelectModel}
                    disabled={savingModel}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {selectableModels.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                          {m === config.envDefault ? " (env default)" : ""}
                          {m === config.fallback ? " (fallback)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {config.isOverridden && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={savingModel}
                    onClick={() => onSelectModel("")}
                  >
                    <RotateCcw className="mr-2 h-3 w-3" />
                    Reset to default ({config.envDefault})
                  </Button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <ConfigStat
                  label="Active model"
                  value={
                    config.primary + (config.isOverridden ? " · override" : "")
                  }
                />
                <ConfigStat label="Fallback model" value={config.fallback} />
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <KeyRound className="h-3 w-3" /> Gemini API key
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      config.hasApiKey
                        ? "border-green-300 text-green-700 dark:text-green-300"
                        : "border-red-300 text-red-700 dark:text-red-300"
                    }
                  >
                    {config.hasApiKey ? "Set" : "Missing"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Models</CardTitle>
          <CardDescription>
            Send a tiny prompt to each model and see its live status, latency
            and response.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {models.map((model) => (
            <ModelRow
              key={model}
              model={model}
              role={
                config?.primary === model
                  ? "primary"
                  : config?.fallback === model
                    ? "fallback"
                    : undefined
              }
              result={results[model]}
              testing={!!testing[model]}
              onTest={() => runTest(model)}
            />
          ))}

          <div className="flex items-center gap-2 pt-3">
            <Input
              placeholder="Test a custom model name (e.g. gemini-2.5-flash-latest)"
              value={customModel}
              onChange={(e) => setCustomModel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") runTest(customModel.trim());
              }}
            />
            <Button
              variant="outline"
              onClick={() => runTest(customModel.trim())}
              disabled={!customModel.trim() || !!testing[customModel.trim()]}
            >
              <Play className="mr-2 h-4 w-4" /> Test
            </Button>
          </div>
          {customModel.trim() && results[customModel.trim()] && (
            <ModelRow
              model={customModel.trim()}
              result={results[customModel.trim()]}
              testing={!!testing[customModel.trim()]}
              onTest={() => runTest(customModel.trim())}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ConfigStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="font-mono text-sm">{value}</div>
    </div>
  );
}

function ModelRow({
  model,
  role,
  result,
  testing,
  onTest,
}: {
  model: string;
  role?: "primary" | "fallback";
  result?: Result;
  testing: boolean;
  onTest: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm truncate">{model}</span>
          {role && (
            <Badge variant="outline" className="capitalize text-[10px]">
              {role}
            </Badge>
          )}
        </div>
        <StatusLine result={result} testing={testing} />
      </div>
      <Button size="sm" variant="outline" onClick={onTest} disabled={testing}>
        {testing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

function StatusLine({
  result,
  testing,
}: {
  result?: Result;
  testing: boolean;
}) {
  if (testing) {
    return (
      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Testing…
      </div>
    );
  }
  if (!result) {
    return <div className="mt-1 text-xs text-muted-foreground">Not tested</div>;
  }
  if (result.status === "ok") {
    return (
      <div className="mt-1 flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400">
        <CheckCircle2 className="h-3 w-3" />
        Healthy
        {result.latencyMs != null && (
          <span className="text-muted-foreground">· {result.latencyMs} ms</span>
        )}
        {result.message && (
          <span className="text-muted-foreground truncate">
            · “{result.message}”
          </span>
        )}
      </div>
    );
  }
  return (
    <div className="mt-1 flex items-start gap-1.5 text-xs text-red-700 dark:text-red-400">
      <XCircle className="h-3 w-3 mt-0.5 shrink-0" />
      <span className="break-words">
        {result.httpStatus ? `${result.httpStatus} · ` : ""}
        {result.message}
        {result.latencyMs != null && (
          <span className="text-muted-foreground"> · {result.latencyMs} ms</span>
        )}
      </span>
    </div>
  );
}
