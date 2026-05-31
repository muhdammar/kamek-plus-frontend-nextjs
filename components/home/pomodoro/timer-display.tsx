interface TimerDisplayProps {
  timeLeft: number; // in seconds
}

export function TimerDisplay({ timeLeft }: TimerDisplayProps) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="text-8xl font-mono font-bold tracking-tight">
      {formatted}
    </div>
  );
}
