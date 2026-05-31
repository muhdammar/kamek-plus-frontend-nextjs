import { Button } from "@/components/ui/button";

interface TimerControlsProps {
  isRunning: boolean;
  onToggle: () => void;
  onReset: () => void;
}

export function TimerControls({ isRunning, onToggle, onReset }: TimerControlsProps) {
  return (
    <div className="flex gap-4">
      <Button onClick={onToggle} size="lg">
        {isRunning ? "Pause" : "Start"}
      </Button>
      <Button onClick={onReset} variant="outline" size="lg">
        Reset
      </Button>
    </div>
  );
}
