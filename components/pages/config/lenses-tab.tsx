"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import * as LucideIcons from "lucide-react";
import {
  Plus,
  Trash2,
  Pencil,
  RotateCcw,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

type LensSection = { key: string; title: string; guidance?: string };

type Lens = {
  id: Id<"lenses">;
  key: string;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  sections: LensSection[];
  generatesReport: boolean;
  isBuiltIn: boolean;
  isEnabled: boolean;
  sortOrder: number;
  temperature?: number;
};

function iconFor(name: string): LucideIcon {
  const icons = LucideIcons as unknown as Record<string, LucideIcon>;
  const resolved = icons[name];
  return typeof resolved === "function" ? resolved : Sparkles;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function LensesTab() {
  const lenses = useQuery(api.lenses.list, {}) as Lens[] | undefined;
  const setEnabled = useMutation(api.lenses.setEnabled);
  const remove = useMutation(api.lenses.remove);
  const restoreDefaults = useMutation(api.lenses.restoreDefaults);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Lens | null>(null);
  const [restoring, setRestoring] = useState(false);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (lens: Lens) => {
    setEditing(lens);
    setDialogOpen(true);
  };

  const onToggle = async (lens: Lens, value: boolean) => {
    try {
      await setEnabled({ id: lens.id, isEnabled: value });
    } catch (e) {
      toast.error("Failed to update lens", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const onDelete = async (lens: Lens) => {
    try {
      await remove({ id: lens.id });
      toast.success(`Deleted "${lens.name}"`);
    } catch (e) {
      toast.error("Failed to delete lens", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const onRestoreDefaults = async () => {
    setRestoring(true);
    try {
      const { created } = await restoreDefaults({});
      toast.success(
        created > 0
          ? `Restored ${created} built-in lens${created === 1 ? "" : "es"}.`
          : "All built-in lenses are already present.",
      );
    } catch (e) {
      toast.error("Failed to restore defaults", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onRestoreDefaults} disabled={restoring}>
          {restoring ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw className="mr-2 h-4 w-4" />
          )}
          Restore defaults
        </Button>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          New lens
        </Button>
      </div>

      {!lenses ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Spinner /> Loading lenses…
        </div>
      ) : lenses.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No lenses yet. Create one or restore the built-in defaults.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {lenses.map((lens) => (
            <LensCard
              key={lens.id}
              lens={lens}
              onToggle={(v) => onToggle(lens, v)}
              onEdit={() => openEdit(lens)}
              onDelete={() => onDelete(lens)}
            />
          ))}
        </div>
      )}

      <Separator />

      <StressTestPanel lenses={lenses ?? []} />

      <LensDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lens={editing}
      />
    </div>
  );
}

function LensCard({
  lens,
  onToggle,
  onEdit,
  onDelete,
}: {
  lens: Lens;
  onToggle: (value: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Icon = iconFor(lens.icon);
  return (
    <Card className={lens.isEnabled ? "" : "opacity-70"}>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="truncate">{lens.name}</span>
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {lens.description || "No description"}
            </CardDescription>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {lens.isBuiltIn && (
                <Badge variant="outline" className="text-[10px]">
                  Built-in
                </Badge>
              )}
              {lens.generatesReport && (
                <Badge variant="outline" className="text-[10px]">
                  Generates report
                </Badge>
              )}
              {!lens.isEnabled && (
                <Badge
                  variant="outline"
                  className="border-amber-300 text-amber-700 text-[10px] dark:text-amber-300"
                >
                  Disabled
                </Badge>
              )}
              <Badge variant="outline" className="font-mono text-[10px]">
                {lens.key}
              </Badge>
            </div>
          </div>
          <Switch
            checked={lens.isEnabled}
            onCheckedChange={onToggle}
            aria-label="Enable lens"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {lens.sections.length} section
            {lens.sections.length === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit
            </Button>
            {!lens.isBuiltIn && (
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600 hover:text-red-700"
                onClick={onDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type SectionDraft = { title: string; guidance: string };

function LensDialog({
  open,
  onOpenChange,
  lens,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lens: Lens | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <LensDialogBody
          key={lens?.id ?? "new"}
          lens={lens}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function LensDialogBody({
  lens,
  onClose,
}: {
  lens: Lens | null;
  onClose: () => void;
}) {
  const upsert = useMutation(api.lenses.upsert);
  const isEdit = !!lens;

  const [key, setKey] = useState(lens?.key ?? "");
  const [keyTouched, setKeyTouched] = useState(isEdit);
  const [name, setName] = useState(lens?.name ?? "");
  const [description, setDescription] = useState(lens?.description ?? "");
  const [icon, setIcon] = useState(lens?.icon ?? "Sparkles");
  const [generatesReport, setGeneratesReport] = useState(
    lens?.generatesReport ?? false,
  );
  const [temperature, setTemperature] = useState(
    lens?.temperature != null ? String(lens.temperature) : "",
  );
  const [systemPrompt, setSystemPrompt] = useState(lens?.systemPrompt ?? "");
  const [sections, setSections] = useState<SectionDraft[]>(
    lens?.sections.map((s) => ({
      title: s.title,
      guidance: s.guidance ?? "",
    })) ?? [],
  );
  const [saving, setSaving] = useState(false);

  const PreviewIcon = iconFor(icon);

  const onNameChange = (value: string) => {
    setName(value);
    if (!isEdit && !keyTouched) setKey(slugify(value));
  };

  const addSection = () =>
    setSections((s) => [...s, { title: "", guidance: "" }]);
  const removeSection = (i: number) =>
    setSections((s) => s.filter((_, idx) => idx !== i));
  const updateSection = (i: number, patch: Partial<SectionDraft>) =>
    setSections((s) => s.map((sec, idx) => (idx === i ? { ...sec, ...patch } : sec)));

  const onSave = async () => {
    if (!key.trim()) {
      toast.error("Key is required");
      return;
    }
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!systemPrompt.trim()) {
      toast.error("System prompt is required");
      return;
    }
    const cleanSections = sections
      .filter((s) => s.title.trim())
      .map((s) => ({
        key: slugify(s.title),
        title: s.title.trim(),
        guidance: s.guidance.trim() || undefined,
      }));

    const temp = temperature.trim() === "" ? undefined : Number(temperature);
    if (temp != null && Number.isNaN(temp)) {
      toast.error("Temperature must be a number");
      return;
    }

    setSaving(true);
    try {
      await upsert({
        id: lens?.id,
        key: key.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        icon: icon.trim() || undefined,
        systemPrompt: systemPrompt,
        sections: cleanSections,
        generatesReport,
        sortOrder: lens?.sortOrder,
        temperature: temp,
      });
      toast.success(isEdit ? "Lens updated" : "Lens created");
      onClose();
    } catch (e) {
      toast.error("Failed to save lens", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? `Edit "${lens?.name}"` : "New lens"}</DialogTitle>
        <DialogDescription>
          A lens is a conversational hat plus an optional report template.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="lens-name">Name</Label>
            <Input
              id="lens-name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Root Cause Analysis"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lens-key">Key (slug)</Label>
            <Input
              id="lens-key"
              value={key}
              disabled={isEdit}
              onChange={(e) => {
                setKey(slugify(e.target.value));
                setKeyTouched(true);
              }}
              placeholder="rca"
              className="font-mono"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="lens-description">Description</Label>
          <Input
            id="lens-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A facilitated 5-Whys root cause analysis."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="lens-icon">Icon (lucide name)</Label>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-muted/40">
                <PreviewIcon className="h-4 w-4" />
              </div>
              <Input
                id="lens-icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="Search"
                className="font-mono"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lens-temp">Temperature (optional)</Label>
            <Input
              id="lens-temp"
              type="number"
              min={0}
              max={2}
              step={0.1}
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              placeholder="Model default"
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label htmlFor="lens-report">Generates report</Label>
            <p className="text-xs text-muted-foreground">
              When on, this lens can produce a structured report from its sections.
            </p>
          </div>
          <Switch
            id="lens-report"
            checked={generatesReport}
            onCheckedChange={setGeneratesReport}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="lens-prompt">System prompt</Label>
          <Textarea
            id="lens-prompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="h-40 font-mono text-xs"
            placeholder="Your name is IDA. You are an expert analyst…"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <Label>Report sections</Label>
              <p className="text-xs text-muted-foreground">
                Each section&apos;s key is derived from its title.
              </p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={addSection}>
              <Plus className="mr-2 h-3.5 w-3.5" />
              Add section
            </Button>
          </div>

          {sections.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
              No sections. Add sections to build a report template.
            </p>
          ) : (
            <div className="space-y-3">
              {sections.map((section, i) => (
                <div key={i} className="space-y-2 rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Input
                      value={section.title}
                      onChange={(e) => updateSection(i, { title: e.target.value })}
                      placeholder="Section title"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => removeSection(i)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {section.title.trim() && (
                    <p className="font-mono text-[10px] text-muted-foreground">
                      key: {slugify(section.title) || "—"}
                    </p>
                  )}
                  <Textarea
                    value={section.guidance}
                    onChange={(e) => updateSection(i, { guidance: e.target.value })}
                    placeholder="Guidance for this section (optional)"
                    className="h-20 text-xs"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={onSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? "Save changes" : "Create lens"}
        </Button>
      </DialogFooter>
    </>
  );
}

type Insight = {
  id: Id<"insights">;
  insightCode: string;
  topicName: string;
  topicCode: string;
  status: string;
};

function StressTestPanel({ lenses }: { lenses: Lens[] }) {
  const insights = useQuery(api.insights.list, {}) as Insight[] | undefined;
  const getOrCreateForInsight = useMutation(api.sessions.getOrCreateForInsight);
  const generate = useMutation(api.analysisReports.generate);

  const reportLenses = useMemo(
    () => lenses.filter((l) => l.generatesReport),
    [lenses],
  );

  const [lensKey, setLensKey] = useState<string>("");
  const [insightId, setInsightId] = useState<string>("");
  const [reportId, setReportId] = useState<Id<"analysisReports"> | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!lensKey && reportLenses.length > 0) setLensKey(reportLenses[0].key);
  }, [reportLenses, lensKey]);
  useEffect(() => {
    if (!insightId && insights && insights.length > 0)
      setInsightId(insights[0].id);
  }, [insights, insightId]);

  const report = useQuery(
    api.analysisReports.get,
    reportId ? { reportId } : "skip",
  );

  const onGenerate = async () => {
    if (!lensKey || !insightId) return;
    setStarting(true);
    setReportId(null);
    try {
      const { id: sessionId } = await getOrCreateForInsight({
        insightId: insightId as Id<"insights">,
        lensKey,
      });
      const { reportId: newReportId } = await generate({ sessionId });
      setReportId(newReportId);
    } catch (e) {
      toast.error("Failed to generate test report", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setStarting(false);
    }
  };

  const generating = report?.status === "GENERATING";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Stress-test a lens</CardTitle>
        <CardDescription>
          Run a report-generating lens against a real insight end-to-end. This
          proves the lens&apos;s prompt and sections produce a report.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Report lens</Label>
            <Select value={lensKey} onValueChange={setLensKey}>
              <SelectTrigger>
                <SelectValue placeholder="Select a report lens" />
              </SelectTrigger>
              <SelectContent>
                {reportLenses.map((l) => (
                  <SelectItem key={l.id} value={l.key}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {reportLenses.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No report-generating lenses. Enable &quot;Generates report&quot;
                on a lens first.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Insight</Label>
            <Select value={insightId} onValueChange={setInsightId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an insight" />
              </SelectTrigger>
              <SelectContent>
                {(insights ?? []).map((ins) => (
                  <SelectItem key={ins.id} value={ins.id}>
                    {ins.insightCode} · {ins.topicName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={onGenerate}
          disabled={!lensKey || !insightId || starting || generating}
        >
          {starting || generating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          {starting || generating ? "Generating…" : "Generate test report"}
        </Button>

        {reportId && (
          <div className="rounded-lg border p-4">
            {!report ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner /> Loading report…
              </div>
            ) : report.status === "GENERATING" ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Generating report…
              </div>
            ) : report.status === "FAILED" ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <XCircle className="h-4 w-4" /> Generation failed
                </div>
                <pre className="max-h-48 overflow-auto rounded border bg-red-50 p-2 text-[11px] whitespace-pre-wrap dark:bg-red-950/30">
                  {report.error ?? "Unknown error"}
                </pre>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" /> {report.title || "Report complete"}
                </div>
                {report.sections.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Report complete but produced no sections.
                  </p>
                ) : (
                  report.sections.map((s) => (
                    <div key={s.key} className="space-y-1">
                      <h4 className="text-sm font-semibold">{s.title}</h4>
                      <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                        {s.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
