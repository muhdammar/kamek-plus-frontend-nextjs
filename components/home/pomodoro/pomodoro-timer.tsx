"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModeTabs } from "./mode-tabs";
import { TimerDisplay } from "./timer-display";
import { TimerControls } from "./timer-controls";
import { TimerSettings } from "./timer-settings";
import { playBell, playStartSound } from "@/lib/play-bell";

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
  const endTimeRef = useRef<number | null>(null);

  // Countdown tick
  useEffect(() => {
    if (!isRunning) return;

    const tick = () => {
      const endTime = endTimeRef.current;
      if (!endTime) return;

      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining === 0) {
        setIsRunning(false);
        endTimeRef.current = null;
      }
    };

    const interval = setInterval(tick, 250);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") tick();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isRunning]);

  // Play bell when countdown finishes
  useEffect(() => {
    if (timeLeft === 0) playBell();
  }, [timeLeft]);

  function handleReset() {
    setIsRunning(false);
    endTimeRef.current = null;
    setTimeLeft(durations[mode]);
  }

  function handleModeChange(nextMode: Mode) {
    setMode(nextMode);
    setIsRunning(false);
    endTimeRef.current = null;
    setTimeLeft(durations[nextMode]);
  }

  function handleSaveDurations(newDurations: Durations) {
    setDurations(newDurations);
    setIsRunning(false);
    endTimeRef.current = null;
    setTimeLeft(newDurations[mode]);
  }

  function handleToggle() {
    if (!isRunning) {
      playStartSound();
      endTimeRef.current = Date.now() + timeLeft * 1000;
    } else {
      const endTime = endTimeRef.current;
      if (endTime) {
        setTimeLeft(Math.max(0, Math.ceil((endTime - Date.now()) / 1000)));
      }
      endTimeRef.current = null;
    }

    setIsRunning((prev) => !prev);
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
        <ModeTabs mode={mode} onModeChange={handleModeChange} />
        <TimerDisplay timeLeft={timeLeft} />
        <TimerControls
          isRunning={isRunning}
          onToggle={handleToggle}
          onReset={handleReset}
        />
      </CardContent>
    </Card>
  );
}
