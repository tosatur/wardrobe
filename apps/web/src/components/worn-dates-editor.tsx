"use client";

import { useState } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function WornDatesEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (dates: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function addDate() {
    if (!draft || value.includes(draft)) return;
    onChange([...value, draft].sort().reverse());
    setDraft("");
  }

  function removeDate(date: string) {
    onChange(value.filter((d) => d !== date));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          type="date"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={addDate}>
          Add
        </Button>
      </div>
      {value.length === 0 && <p className="text-sm text-muted-foreground">Not worn yet.</p>}
      {value.length > 0 && (
        <ul className="flex flex-col gap-1">
          {value.map((date) => (
            <li
              key={date}
              className="flex items-center justify-between gap-2 border border-foreground/10 bg-muted px-2.5 py-1.5 text-sm"
            >
              <span>{formatDate(date)}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => removeDate(date)}
                aria-label={`Remove ${formatDate(date)}`}
              >
                <XIcon />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
