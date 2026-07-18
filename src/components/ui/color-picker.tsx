import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  { name: "Emerald", value: "#10b981" },
  { name: "Green", value: "#22c55e" },
  { name: "Lime", value: "#84cc16" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Pink", value: "#ec4899" },
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Yellow", value: "#eab308" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Slate", value: "#64748b" },
  { name: "Gray", value: "#6b7280" },
];

const hexRegex = /^#[0-9A-Fa-f]{6}$/;

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [hexInput, setHexInput] = useState(value || "");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setHexInput(value || "");
  }, [value]);

  const displayColor = hexRegex.test(value) ? value : "#cccccc";

  const handlePresetSelect = (color: string) => {
    setHexInput(color);
    onChange(color);
    setOpen(false);
  };

  const handleHexInput = (input: string) => {
    setHexInput(input);
    if (hexRegex.test(input)) {
      onChange(input);
    }
  };

  const handleBlur = () => {
    if (!hexRegex.test(hexInput)) {
      setHexInput(value || "");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-label="Pick a color"
          className="flex h-10 w-full items-center gap-3 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <span
            className="h-5 w-5 shrink-0 rounded-full border border-border"
            style={{ backgroundColor: displayColor }}
          />
          <span className="font-mono text-xs text-muted-foreground">
            {value || "No color"}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start" sideOffset={8}>
        <div className="space-y-3">
          <div className="grid grid-cols-5 gap-2">
            {PRESET_COLORS.map(({ name, value: color }) => (
              <button
                key={color}
                type="button"
                title={name}
                aria-label={name}
                onClick={() => handlePresetSelect(color)}
                className={cn(
                  "h-8 w-8 rounded-full border-2 transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  value === color
                    ? "scale-110 border-foreground ring-1 ring-foreground"
                    : "border-transparent hover:border-foreground/50",
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-8 w-8 shrink-0 rounded-md border border-border"
              style={{ backgroundColor: displayColor }}
            />
            <Input
              value={hexInput}
              onChange={(e) => handleHexInput(e.target.value)}
              onBlur={handleBlur}
              placeholder="#000000"
              className="font-mono text-xs h-8"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
