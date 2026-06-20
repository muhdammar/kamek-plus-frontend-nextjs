"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Mode = "focus" | "short-break" | "long-break";

interface Durations {
  focus: number;
  "short-break": number;
  "long-break": number;
}

interface TimerSettingsProps {
  durations: Durations;
  onSave: (durations: Durations) => void;
}

export function TimerSettings({ durations, onSave }: TimerSettingsProps) {
  // local draft state — only applied when user clicks Save
  const [draft, setDraft] = useState({
    focus: durations.focus / 60,
    "short-break": durations["short-break"] / 60,
    "long-break": durations["long-break"] / 60,
  });

  function handleChange(key: Mode, value: string) {
    const num = Math.max(1, Number(value)); // minimum 1 minute
    setDraft((prev) => ({ ...prev, [key]: num }));
  }

  function handleSave() {
    onSave({
      focus: draft.focus * 60,
      "short-break": draft["short-break"] * 60,
      "long-break": draft["long-break"] * 60,
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl p-5">
        <DialogHeader>
          <DialogTitle>Timer Settings</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          {(
            [
              { key: "focus", label: "Focus" },
              { key: "short-break", label: "Short Break" },
              { key: "long-break", label: "Long Break" },
            ] as { key: Mode; label: string }[]
          ).map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <label className="text-sm font-medium w-28">{label} (min)</label>
              <Input
                type="number"
                min={1}
                value={draft[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-20 text-center"
              />
            </div>
          ))}
        </div>
        <DialogClose asChild>
          <Button onClick={handleSave} className="w-full">
            Save
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
