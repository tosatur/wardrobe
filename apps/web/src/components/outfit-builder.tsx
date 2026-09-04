"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { ChevronDownIcon } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { OutfitCreateSchema, OutfitUpdateSchema, type OutfitDto } from "@wardrobe/shared";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/ui/field";
import { SectionEyebrow } from "@/components/section-eyebrow";
import { StarRating } from "@/components/star-rating";
import { TagPicker } from "@/components/tag-picker";
import { WornDatesEditor } from "@/components/worn-dates-editor";
import { ItemPalette } from "@/components/item-palette";
import { OutfitCanvas } from "@/components/outfit-canvas";
import { OutfitAnalysis } from "@/components/outfit-analysis";
import { OutfitDragOverlay, type ActiveDragGhost } from "@/components/outfit-drag-overlay";
import { useOutfitCanvasStore } from "@/lib/outfit-canvas-store";
import {
  createOutfit,
  logWear,
  updateOutfit,
  uploadOutfitCoverPhoto,
  type OutfitPayload,
} from "@/lib/outfits-client";
import { composeOutfitCover } from "@/lib/outfit-cover";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

type OutfitFormValues = {
  name: string;
  description: string;
  rating: number | null;
  tags: string[];
  wornDates: string[];
};

function toFormValues(outfit?: OutfitDto): OutfitFormValues {
  return {
    name: outfit?.name ?? "",
    description: outfit?.description ?? "",
    rating: outfit?.rating ?? null,
    tags: outfit?.tags ?? [],
    wornDates: outfit?.wornDates.map((w) => w.date.slice(0, 10)) ?? [],
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function OutfitBuilder({ outfit }: { outfit?: OutfitDto }) {
  const router = useRouter();
  const mode = outfit ? "edit" : "create";
  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting, isDirty, isSubmitSuccessful },
  } = useForm<OutfitFormValues>({ defaultValues: toFormValues(outfit) });

  const rating = useWatch({ control, name: "rating" });
  const tags = useWatch({ control, name: "tags" });
  const wornDates = useWatch({ control, name: "wornDates" });

  const placements = useOutfitCanvasStore((s) => s.placements);
  const addPlacement = useOutfitCanvasStore((s) => s.addPlacement);
  const movePlacement = useOutfitCanvasStore((s) => s.movePlacement);
  const removePlacement = useOutfitCanvasStore((s) => s.removePlacement);
  const bringToFront = useOutfitCanvasStore((s) => s.bringToFront);
  const clearPlacements = useOutfitCanvasStore((s) => s.clearAll);
  const isCanvasDirty = useOutfitCanvasStore((s) => s.isDirty);

  useUnsavedChanges(!isSubmitSuccessful && (isDirty || isCanvasDirty));

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const [activeDragGhost, setActiveDragGhost] = useState<ActiveDragGhost>(null);
  const canvasFrameRef = useRef<HTMLDivElement>(null);

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current;
    if (data?.type === "placed") {
      bringToFront(data.itemId as string);
      const placement = placements.find((p) => p.itemId === data.itemId);
      if (placement) {
        setActiveDragGhost({
          photoCutoutUrl: placement.photoCutoutUrl,
          label: placement.nickname ?? placement.categoryName,
          sizeScale: 1,
        });
      }
    } else if (data?.type === "palette") {
      const canvasWidth = canvasFrameRef.current?.getBoundingClientRect().width;
      const tileWidth = data.tileWidth as number | null;
      // 1/3 matches CanvasItem's w-1/3 sizing class.
      const sizeScale =
        canvasWidth && tileWidth ? (canvasWidth * (1 / 3)) / tileWidth : 1;
      setActiveDragGhost({
        photoCutoutUrl: data.item.photoCutoutUrl,
        label: data.item.nickname ?? data.item.categoryName,
        sizeScale,
      });
    }
  }

  function handleDragCancel() {
    setActiveDragGhost(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragGhost(null);
    const data = event.active.data.current;

    if (event.over?.id === "item-palette" && data?.type === "placed") {
      removePlacement(data.itemId as string);
      return;
    }

    if (!event.over || event.over.id !== "outfit-canvas") return;
    const canvasRect = event.over.rect;
    const droppedRect = event.active.rect.current.translated;
    if (!droppedRect) return;

    const centerX = droppedRect.left + droppedRect.width / 2;
    const centerY = droppedRect.top + droppedRect.height / 2;
    const pctX = clamp(((centerX - canvasRect.left) / canvasRect.width) * 100, 0, 100);
    const pctY = clamp(((centerY - canvasRect.top) / canvasRect.height) * 100, 0, 100);

    if (data?.type === "palette") addPlacement(data.item, pctX, pctY);
    if (data?.type === "placed") movePlacement(data.itemId as string, pctX, pctY);
  }

  async function onSubmit(values: OutfitFormValues, logToday: boolean) {
    const payload: OutfitPayload = {
      name: values.name,
      description: values.description || undefined,
      rating: values.rating,
      tags: values.tags,
      wornDates: values.wornDates,
      items: placements.map((p) => ({
        itemId: p.itemId,
        x: p.x,
        y: p.y,
        zIndex: p.zIndex,
        scale: p.scale,
        rotation: p.rotation,
      })),
    };
    const schema = mode === "create" ? OutfitCreateSchema : OutfitUpdateSchema;
    const parsed = schema.safeParse(payload);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "name" || field === "description") {
          setError(field, { message: issue.message });
        } else {
          toast.error(issue.message);
        }
      }
      return;
    }

    const result =
      mode === "create" ? await createOutfit(payload) : await updateOutfit(outfit!.id, payload);

    if (result.error || !result.data) {
      toast.error(result.error ?? "Something went wrong.");
      return;
    }

    if (logToday) {
      const wearResult = await logWear(result.data.id);
      if (wearResult.error) {
        toast.error(`Outfit saved, but today's wear wasn't logged: ${wearResult.error}`);
      }
    }

    // Best-effort: a cover image makes list/grid views much cheaper than
    // re-rendering every item's div on every card, but it's a nicety, not
    // something that should block the save if it fails.
    if (placements.length > 0) {
      const cover = await composeOutfitCover(placements);
      if (cover) {
        await uploadOutfitCoverPhoto(result.data.id, cover);
      }
    }

    toast.success(mode === "create" ? "Outfit created." : "Outfit updated.");
    router.push(`/outfits/${result.data.id}`);
    router.refresh();
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <form
        onSubmit={(e) => void handleSubmit((values) => onSubmit(values, false))(e)}
        className="flex h-full flex-col"
      >
        {/* Toolbar: the outfit's name reads as a page title, not a form
            field, so this workspace feels like a tool you're working in
            rather than a form you're filling out. Its own bar, distinct
            from the panels below, like an app's title bar. */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-6 py-4">
          <div className="flex min-w-0 flex-col">
            <input
              {...register("name", { required: true })}
              placeholder="Untitled outfit"
              className="w-full min-w-0 bg-transparent font-heading text-2xl font-black tracking-tight uppercase outline-none placeholder:text-muted-foreground/40"
            />
            {errors.name && <FieldError>{errors.name.message ?? "Required."}</FieldError>}
          </div>
          <ButtonGroup className="shrink-0">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : mode === "create" ? "Create outfit" : "Save changes"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button type="button" disabled={isSubmitting} aria-label="More save options" />
                }
              >
                <ChevronDownIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => void handleSubmit((values) => onSubmit(values, true))()}
                >
                  Save and log today
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>
        </div>

        {/* Three panels: your items, the canvas, the outfit's own details.
            Each is its own bordered surface, like a real app's side panels,
            filling the rest of the viewport and scrolling independently. */}
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="w-full shrink-0 overflow-y-auto border-b border-border bg-card p-4 lg:h-full lg:w-72 lg:border-r lg:border-b-0">
            <ItemPalette />
          </div>

          <div className="flex min-h-96 flex-1 flex-col overflow-y-auto bg-card p-8">
            <div className="mb-4 flex justify-end">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={clearPlacements}
                disabled={placements.length === 0}
              >
                Clear all
              </Button>
            </div>
            <div className="flex flex-1 items-center justify-center">
              <div
                ref={canvasFrameRef}
                className="aspect-square h-full max-h-[min(70vh,640px)] w-auto"
              >
                <OutfitCanvas />
              </div>
            </div>
          </div>

          <div className="w-full shrink-0 overflow-y-auto border-t border-border bg-card p-4 lg:h-full lg:w-80 lg:border-t-0 lg:border-l">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <SectionEyebrow>Description</SectionEyebrow>
                <Textarea placeholder="What's this outfit for?" {...register("description")} />
              </div>

              <div className="flex flex-col gap-2">
                <SectionEyebrow>Rating</SectionEyebrow>
                <StarRating value={rating} onChange={(v) => setValue("rating", v)} />
              </div>

              <div className="flex flex-col gap-2">
                <SectionEyebrow>Tags</SectionEyebrow>
                <TagPicker values={tags} onChange={(v) => setValue("tags", v)} />
              </div>

              <div className="flex flex-col gap-2">
                <SectionEyebrow>Worn on</SectionEyebrow>
                <WornDatesEditor value={wornDates} onChange={(v) => setValue("wornDates", v)} />
              </div>

              {placements.length > 0 && (
                <div className="flex flex-col gap-2">
                  <SectionEyebrow>Analysis</SectionEyebrow>
                  <OutfitAnalysis items={placements} />
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
      <OutfitDragOverlay ghost={activeDragGhost} />
    </DndContext>
  );
}
