"use client";

import { useTheme } from "next-themes";
import { Moon, MonitorIcon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: MonitorIcon },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <ButtonGroup>
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <Button
          key={value}
          type="button"
          variant={theme === value ? "default" : "outline"}
          size="sm"
          aria-pressed={theme === value}
          onClick={() => setTheme(value)}
        >
          <Icon />
          {label}
        </Button>
      ))}
    </ButtonGroup>
  );
}
