import { Button } from "@/components/ui/button";

type Mode = "focus" | "short-break" | "long-break";

interface ModeTabsProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}

const modes: { label: string; value: Mode }[] = [
  { label: "Focus", value: "focus" },
  { label: "Short Break", value: "short-break" },
  { label: "Long Break", value: "long-break" },
];

export function ModeTabs({ mode, onModeChange }: ModeTabsProps) {
  return (
    <div className="flex gap-2">
      {modes.map((m) => (
        <Button
          key={m.value}
          variant={mode === m.value ? "default" : "outline"}
          size="sm"
          onClick={() => onModeChange(m.value)}
        >
          {m.label}
        </Button>
      ))}
    </div>
  );
}
