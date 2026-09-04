import { Loader2Icon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * The dark-glass spinner badge shown over a photo frame while background
 * removal is still running server-side - shared between the item detail
 * view and the edit form's upload control so a long-running job always
 * gets the same "working" feedback instead of the UI sitting silent.
 */
export function PhotoProcessingBadge({ className }: { className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div
            role="status"
            aria-label="Removing background"
            className={cn(
              "flex items-center justify-center rounded-sm border border-white/20 bg-black/40 p-1.5 text-white backdrop-blur-md",
              className,
            )}
          />
        }
      >
        <Loader2Icon className="size-4 animate-spin" />
      </TooltipTrigger>
      <TooltipContent>Removing background…</TooltipContent>
    </Tooltip>
  );
}
