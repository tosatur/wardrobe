"use client";

import { useTheme } from "next-themes";
import { Moon, MonitorIcon, Sun } from "lucide-react";
import { SegmentedControl } from "@/components/segmented-control";

type Theme = "light" | "dark" | "system";

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: MonitorIcon },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <SegmentedControl
      value={theme as Theme | undefined}
      onChange={setTheme}
      options={OPTIONS}
    />
  );
}
