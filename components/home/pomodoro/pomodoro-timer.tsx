"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModeTabs } from "./mode-tabs";
import { TimerDisplay } from "./timer-display";
import { TimerControls } from "./timer-controls";
import { TimerSettings } from "./timer-settings";
import { playBell } from "@/lib/play-bell";

type Mode = "focus" | "short-break" | "long-break";

type Durations = Record<Mode, number>;

const DEFAULT_DURATIONS: Durations = {
  focus: 25 * 60,
  "short-break": 5 * 60,
  "long-break": 15 * 60,
};

export function PomodoroTimer() {
  const [mode, setMode] = useState<Mode>("focus");
  const [durations, setDurations] = useState<Durations>(DEFAULT_DURATIONS);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATIONS["focus"]);
  const [isRunning, setIsRunning] = useState(false);

  // Reset timer whenever mode changes
  useEffect(() => {
    setIsRunning(false);
    setTimeLeft(durations[mode]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Countdown tick
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  // Play bell when countdown finishes
  useEffect(() => {
    if (timeLeft === 0) playBell();
  }, [timeLeft]);

  function handleReset() {
    setIsRunning(false);
    setTimeLeft(durations[mode]);
  }

  function handleSaveDurations(newDurations: Durations) {
    setDurations(newDurations);
    setIsRunning(false);
    setTimeLeft(newDurations[mode]);
  }

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">Pomodoro Timer</CardTitle>
          <TimerSettings durations={durations} onSave={handleSaveDurations} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-8 pb-8">
        <ModeTabs mode={mode} onModeChange={setMode} />
        <TimerDisplay timeLeft={timeLeft} />
        <TimerControls
          isRunning={isRunning}
          onToggle={() => setIsRunning((prev) => !prev)}
          onReset={handleReset}
        />
      </CardContent>
    </Card>
  );
}
