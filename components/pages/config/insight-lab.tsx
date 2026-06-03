"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Play, Loader2, RotateCcw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { ScrollArea } from "@/components/ui/scroll-area";

const EXTRA_MODELS = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"];

type Mode = "single" | "stepwise";

export function InsightLab() {
  const config = useQuery(api.ai.modelConfig);
  const topics = useQuery(api.insightLab.topicsWithFeedback);
  const recentRuns = useQuery(api.insightLab.listRuns);
  const startRun = useMutation(api.insightLab.startRun);

  const [topicId, setTopicId] = useState<Id<"topics"> | "">("");
  const [mode, setMode] = useState<Mode>("single");
  const [model, setModel] = useState<string>("");
  const [temperature, setTemperature] = useState<number>(0);
  const [promptText, setPromptText] = useState<string>("");
  const [promptDirty, setPromptDirty] = useState(false);
  const [runId, setRunId] = useState<Id<"aiRuns"> | null>(null);
  const [starting, setStarting] = useState(false);

  const preview = useQuery(
    api.insightLab.promptPreview,
    topicId ? { topicId } : "skip",
  );
  const run = useQuery(api.insightLab.getRun, runId ? { runId } : "skip");
  const logs = useQuery(api.insightLab.runLogs, runId ? { runId } : "skip");

  const modelOptions = useMemo(() => {
    const base = config ? [config.primary, config.fallback] : [];
    return Array.from(new Set([...base, ...EXTRA_MODELS]));
  }, [config]);

  // Default model + topic once data loads.
  useEffect(() => {
    if (!model && config) setModel(config.primary);
  }, [config, model]);
  useEffect(() => {
    if (!topicId && topics && topics.length > 0) setTopicId(topics[0].id);
  }, [topics, topicId]);

  // Seed the editable prompt from the preview unless the user has edited it.
  useEffect(() => {
    if (preview && !promptDirty) setPromptText(preview.singlePrompt);
  }, [preview, promptDirty]);

  const onTopicChange = (value: string) => {
    setTopicId(value as Id<"topics">);
    setPromptDirty(false);
    setRunId(null);
  };

  const onRun = async () => {
    if (!topicId) return;
    setStarting(true);
    try {
      const { runId: id } = await startRun({
        topicId,
        mode,
        model,
        temperature,
        promptOverride:
          mode === "single" && promptDirty ? promptText : undefined,
      });
      setRunId(id);
    } finally {
      setStarting(false);
    }
  };

  const isRunning = run?.status === "running" || starting;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Run a generation</CardTitle>
          <CardDescription>
            Test runs are isolated — they never touch real insights or send
            notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs text-muted-foreground">Topic</label>
              <Select value={topicId} onValueChange={onTopicChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a topic with feedback" />
                </SelectTrigger>
                <SelectContent>
                  {(topics ?? []).map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.topicCode} · {t.name} ({t.feedbackCount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Model</label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Model" />
                </SelectTrigger>
                <SelectContent>
                  {modelOptions.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                      {config?.primary === m ? " (primary)" : ""}
                      {config?.fallback === m ? " (fallback)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">
                Mode
              </label>
              <div className="mt-1">
                <ToggleGroup
                  type="single"
                  variant="outline"
                  value={mode}
                  onValueChange={(v) => v && setMode(v as Mode)}
                >
                  <ToggleGroupItem value="single">
                    Single call
                  </ToggleGroupItem>
                  <ToggleGroupItem value="stepwise">
                    Stepwise (4 calls)
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">
                Temperature
              </label>
              <Input
                type="number"
                min={0}
                max={2}
                step={0.1}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={onRun} disabled={!topicId || isRunning}>
              {isRunning ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {isRunning ? "Generating…" : "Run generation"}
            </Button>
            {mode === "single" && promptDirty && (
              <span className="text-xs text-amber-600 dark:text-amber-400">
                Using your edited prompt
              </span>
            )}
            {mode === "stepwise" && (
              <span className="text-xs text-muted-foreground">
                Stepwise ignores the prompt override and uses per-section
                prompts.
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: input + prompt */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Input &amp; Prompt
              </CardTitle>
              <CardDescription>
                Exactly what is fed to the model — inspect and edit before
                running.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" defaultValue={["prompt"]}>
                <AccordionItem value="input">
                  <AccordionTrigger className="text-sm">
                    Input context
                    {preview && (
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        {preview.input.feedbacks.length} feedback
                      </Badge>
                    )}
                  </AccordionTrigger>
                  <AccordionContent>
                    {!preview ? (
                      <p className="text-xs text-muted-foreground">Loading…</p>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-xs">
                          <span className="text-muted-foreground">Topic: </span>
                          {preview.input.topic.name} (
                          {preview.input.topic.topicCode})
                        </div>
                        <ScrollArea className="h-48 rounded border p-2">
                          <div className="space-y-2">
                            {preview.input.feedbacks.map((f) => (
                              <div key={f.feedbackId} className="text-xs">
                                <span className="font-mono text-muted-foreground">
                                  {f.feedbackCode}
                                </span>{" "}
                                <Badge
                                  variant="outline"
                                  className="text-[9px] capitalize"
                                >
                                  {f.sentiment.toLowerCase() || "—"}
                                </Badge>
                                <div className="text-muted-foreground">
                                  {f.displayName}: “{f.text}”
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="prompt">
                  <AccordionTrigger className="text-sm">
                    {mode === "single"
                      ? "Assembled prompt (editable)"
                      : "Per-section prompts (stepwise)"}
                  </AccordionTrigger>
                  <AccordionContent>
                    {mode === "single" ? (
                      <div className="space-y-2">
                        <Textarea
                          value={promptText}
                          onChange={(e) => {
                            setPromptText(e.target.value);
                            setPromptDirty(true);
                          }}
                          className="h-72 font-mono text-xs"
                          spellCheck={false}
                        />
                        {promptDirty && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setPromptDirty(false);
                              if (preview) setPromptText(preview.singlePrompt);
                            }}
                          >
                            <RotateCcw className="mr-2 h-3 w-3" />
                            Reset to default
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Accordion type="single" collapsible>
                        {(preview?.steps ?? []).map((s) => (
                          <AccordionItem key={s.section} value={s.section}>
                            <AccordionTrigger className="text-xs capitalize">
                              {s.section}
                            </AccordionTrigger>
                            <AccordionContent>
                              <pre className="max-h-60 overflow-auto rounded border bg-muted/30 p-2 text-[11px] whitespace-pre-wrap">
                                {s.prompt}
                              </pre>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Right: dev log + output */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Dev log</CardTitle>
                <RunStatus run={run} />
              </div>
              <CardDescription>
                Live, step-by-step trace of the generation pipeline.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64 rounded border bg-muted/20 p-2">
                {!logs || logs.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-2">
                    {runId ? "Waiting for log…" : "Run a generation to see the live trace."}
                  </p>
                ) : (
                  <div className="space-y-1 font-mono text-[11px]">
                    {logs.map((l) => (
                      <LogLine key={l.id} log={l} />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {run && (run.status === "done" || run.status === "failed") && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Output</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" defaultValue={["result"]}>
                  {run.error && (
                    <AccordionItem value="error">
                      <AccordionTrigger className="text-sm text-red-600">
                        Error
                      </AccordionTrigger>
                      <AccordionContent>
                        <pre className="max-h-48 overflow-auto rounded border bg-red-50 dark:bg-red-950/30 p-2 text-[11px] whitespace-pre-wrap">
                          {run.error}
                        </pre>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                  {run.result != null && (
                    <AccordionItem value="result">
                      <AccordionTrigger className="text-sm">
                        Parsed result
                      </AccordionTrigger>
                      <AccordionContent>
                        <pre className="max-h-96 overflow-auto rounded border bg-muted/30 p-2 text-[11px] whitespace-pre-wrap">
                          {JSON.stringify(run.result, null, 2)}
                        </pre>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                  {run.rawOutput && (
                    <AccordionItem value="raw">
                      <AccordionTrigger className="text-sm">
                        Raw model output
                      </AccordionTrigger>
                      <AccordionContent>
                        <pre className="max-h-96 overflow-auto rounded border bg-muted/30 p-2 text-[11px] whitespace-pre-wrap">
                          {run.rawOutput}
                        </pre>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Run history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent runs</CardTitle>
          <CardDescription>Click a run to load its trace + output.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {!recentRuns || recentRuns.length === 0 ? (
            <p className="text-xs text-muted-foreground">No runs yet.</p>
          ) : (
            recentRuns.map((r) => (
              <button
                key={r.id}
                onClick={() => setRunId(r.id)}
                className={`flex w-full items-center gap-3 rounded-lg border p-2 text-left text-xs hover:bg-muted/50 ${
                  r.id === runId ? "border-primary" : ""
                }`}
              >
                <StatusDot status={r.status} />
                <span className="font-mono">{r.topicCode}</span>
                <span className="text-muted-foreground truncate flex-1">
                  {r.topicName}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {r.mode}
                </Badge>
                <span className="font-mono text-muted-foreground">
                  {r.modelUsed ?? r.model}
                </span>
                {r.durationMs != null && (
                  <span className="text-muted-foreground inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {(r.durationMs / 1000).toFixed(1)}s
                  </span>
                )}
              </button>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RunStatus({
  run,
}: {
  run: { status: string; durationMs?: number | null } | null | undefined;
}) {
  if (!run) return null;
  if (run.status === "running") {
    return (
      <Badge variant="outline" className="text-amber-600 border-amber-300">
        <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Running
      </Badge>
    );
  }
  if (run.status === "done") {
    return (
      <Badge variant="outline" className="text-green-700 border-green-300">
        Done{run.durationMs != null ? ` · ${(run.durationMs / 1000).toFixed(1)}s` : ""}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-red-700 border-red-300">
      Failed
    </Badge>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "done"
      ? "bg-green-500"
      : status === "failed"
        ? "bg-red-500"
        : "bg-amber-500 animate-pulse";
  return <span className={`h-2 w-2 shrink-0 rounded-full ${color}`} />;
}

const LEVEL_COLOR: Record<string, string> = {
  info: "text-muted-foreground",
  step: "text-blue-600 dark:text-blue-400",
  success: "text-green-700 dark:text-green-400",
  warn: "text-amber-600 dark:text-amber-400",
  error: "text-red-600 dark:text-red-400",
};

function LogLine({
  log,
}: {
  log: {
    ts: number;
    level: string;
    message: string;
    data: unknown;
  };
}) {
  const time = new Date(log.ts).toLocaleTimeString("en-GB");
  return (
    <div className={LEVEL_COLOR[log.level] ?? ""}>
      <span className="text-muted-foreground">{time} </span>
      <span className="uppercase text-[9px]">[{log.level}]</span> {log.message}
      {log.data != null && (
        <span className="text-muted-foreground">
          {" "}
          {JSON.stringify(log.data)}
        </span>
      )}
    </div>
  );
}
