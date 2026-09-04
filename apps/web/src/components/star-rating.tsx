"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const POSITIONS = [1, 2, 3, 4, 5];

function starFill(position: number, value: number): "full" | "half" | "empty" {
  if (value >= position) return "full";
  if (value >= position - 0.5) return "half";
  return "empty";
}

export function StarRating({
  value,
  onChange,
  readOnly,
  size = "size-5",
}: {
  value: number | null;
  onChange?: (value: number | null) => void;
  readOnly?: boolean;
  size?: string;
}) {
  const displayValue = value ?? 0;

  return (
    <div className="flex items-center gap-0.5">
      {POSITIONS.map((position) => {
        const fill = starFill(position, displayValue);
        return (
          <div key={position} className={cn("relative", size)}>
            <Star className={cn(size, "text-muted-foreground")} />
            {fill !== "empty" && (
              <div
                className="pointer-events-none absolute inset-0 overflow-hidden"
                style={{ width: fill === "half" ? "50%" : "100%" }}
              >
                <Star className={cn(size, "fill-primary text-primary")} />
              </div>
            )}
            {!readOnly && onChange && (
              <>
                <button
                  type="button"
                  aria-label={`Rate ${position - 0.5} out of 5 stars`}
                  className="absolute inset-y-0 left-0 w-1/2 cursor-pointer"
                  onClick={() => onChange(position - 0.5)}
                />
                <button
                  type="button"
                  aria-label={`Rate ${position} out of 5 stars`}
                  className="absolute inset-y-0 right-0 w-1/2 cursor-pointer"
                  onClick={() => onChange(position)}
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
