"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { ItemCreateSchema, ItemUpdateSchema, type ItemDto, type ItemVisibility } from "@wardrobe/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { SectionEyebrow } from "@/components/section-eyebrow";
import { EntityToolbar } from "@/components/entity-toolbar";
import { TagPicker } from "@/components/tag-picker";
import { PhotoUpload } from "@/components/photo-upload";
import { PhotoPicker } from "@/components/photo-picker";
import { CategoryPicker } from "@/components/category-picker";
import { DatePicker } from "@/components/date-picker";
import { BrandPicker } from "@/components/brand-picker";
import { ColorPicker } from "@/components/color-picker";
import { MaterialPicker } from "@/components/material-picker";
import { CurrencySelect } from "@/components/currency-select";
import { createItem, updateItem, uploadItemPhoto, type ItemPayload } from "@/lib/items-client";
import { getSession } from "@/lib/auth-client";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

type ItemFormValues = {
  nickname: string;
  categoryId: string;
  brandName: string;
  size: string;
  purchaseDate: string;
  price: string;
  currency: string;
  notes: string;
  visibility: ItemVisibility;
  colorIds: string[];
  materialIds: string[];
  tags: string[];
};

function toFormValues(item?: ItemDto): ItemFormValues {
  return {
    nickname: item?.nickname ?? "",
    categoryId: item?.category.id ?? "",
    brandName: item?.brand?.name ?? "",
    size: item?.size ?? "",
    purchaseDate: item?.purchaseDate?.slice(0, 10) ?? "",
    price: item?.price != null ? String(item.price) : "",
    currency: item?.currency ?? "USD",
    notes: item?.notes ?? "",
    visibility: item?.visibility ?? "private",
    colorIds: item?.colors.map((c) => c.id) ?? [],
    materialIds: item?.materials.map((m) => m.id) ?? [],
    tags: item?.tags ?? [],
  };
}

function toPayload(values: ItemFormValues): ItemPayload {
  return {
    nickname: values.nickname || undefined,
    categoryId: values.categoryId,
    brandName: values.brandName || undefined,
    size: values.size || undefined,
    purchaseDate: values.purchaseDate || undefined,
    price: values.price ? Number(values.price) : undefined,
    currency: values.currency,
    notes: values.notes || undefined,
    visibility: values.visibility,
    colorIds: values.colorIds,
    materialIds: values.materialIds,
    tags: values.tags,
  };
}

export function ItemForm({ item, backHref }: { item?: ItemDto; backHref?: string }) {
  const router = useRouter();
  const mode = item ? "edit" : "create";
  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting, isDirty, isSubmitSuccessful },
  } = useForm<ItemFormValues>({ defaultValues: toFormValues(item) });

  const categoryId = useWatch({ control, name: "categoryId" });
  const brandName = useWatch({ control, name: "brandName" });
  const colorIds = useWatch({ control, name: "colorIds" });
  const materialIds = useWatch({ control, name: "materialIds" });
  const tags = useWatch({ control, name: "tags" });
  const visibility = useWatch({ control, name: "visibility" });
  const purchaseDate = useWatch({ control, name: "purchaseDate" });
  const currency = useWatch({ control, name: "currency" });

  // New items default to "USD" until the user's own preference loads;
  // doesn't apply in edit mode, where the item's saved currency already won.
  useEffect(() => {
    if (mode !== "create") return;
    void getSession().then((session) => {
      if (session) setValue("currency", session.user.defaultCurrency);
    });
  }, [mode, setValue]);

  // Staged locally during creation, there's no item id to upload against
  // until the item itself exists, so the file is held here and uploaded
  // right after createItem succeeds.
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  useUnsavedChanges(!isSubmitSuccessful && (isDirty || photoFile !== null));

  function handlePhotoSelect(file: File | null) {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoFile(file);
    setPhotoPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  async function onSubmit(values: ItemFormValues) {
    // categoryId, colorIds, tags etc. are set via setValue rather than
    // register, so react-hook-form never revalidates them on its own -
    // a setError from a previous failed submit would otherwise stick
    // around and block handleSubmit forever even after the field is fixed.
    clearErrors();

    const payload = toPayload(values);
    const schema = mode === "create" ? ItemCreateSchema : ItemUpdateSchema;
    const parsed = schema.safeParse(payload);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string") {
          setError(field as keyof ItemFormValues, { message: issue.message });
        }
      }
      return;
    }

    const result =
      mode === "create" ? await createItem(payload) : await updateItem(item!.id, payload);

    if (result.error || !result.data) {
      toast.error(result.error ?? "Something went wrong.");
      return;
    }

    if (mode === "create" && photoFile) {
      const photoResult = await uploadItemPhoto(result.data.id, photoFile);
      if (photoResult.error) {
        toast.error(`Item created, but the photo didn't upload: ${photoResult.error}`);
      }
    }

    toast.success(mode === "create" ? "Item created." : "Item updated.");
    // Replace, not push: the create/edit screen and the view it lands on
    // are the same logical "item detail" history entry (this matters once
    // that entry is a modal — replacing means closing the view afterward
    // goes straight back to whatever page opened it, instead of stepping
    // back through the just-submitted form).
    router.replace(`/items/${result.data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="flex flex-col gap-8">
      <EntityToolbar
        backHref={backHref}
        backLabel="Back to closet"
        title={mode === "create" ? "Add an item" : "Edit item"}
        actions={
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : mode === "create" ? "Create item" : "Save changes"}
          </Button>
        }
      />

      <div className="flex flex-col gap-8">
        {/* Row 1: the photo paired with just enough fields (Identity + Details)
            to roughly match its height, a photo alone against the full field
            list left a dead gap once the list ran taller than a square photo. */}
        <div className="grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-[5fr_7fr]">
          <div>
            {item ? (
              <PhotoUpload
                itemId={item.id}
                currentPhotoUrl={item.photoUrl}
                currentPhotoCutoutUrl={item.photoCutoutUrl}
                photoStatus={item.photoStatus}
                onUploaded={() => router.refresh()}
              />
            ) : (
              <PhotoPicker previewUrl={photoPreviewUrl} onSelect={handlePhotoSelect} />
            )}
          </div>

          <div className="flex flex-col gap-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="nickname">Nickname</FieldLabel>
                <Input
                  id="nickname"
                  placeholder="e.g. Rainy day jacket"
                  className="text-base font-medium md:text-base"
                  {...register("nickname")}
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="categoryId">Category</FieldLabel>
                  <CategoryPicker
                    value={categoryId}
                    onChange={(id) => setValue("categoryId", id)}
                  />
                  {errors.categoryId && (
                    <FieldError>{errors.categoryId.message ?? "Required."}</FieldError>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="brandName">Brand</FieldLabel>
                  <BrandPicker
                    value={brandName || null}
                    onChange={(name) => setValue("brandName", name)}
                  />
                </Field>
              </div>
            </FieldGroup>

            <div className="flex flex-col gap-4">
              <SectionEyebrow>Details</SectionEyebrow>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="size">Size</FieldLabel>
                  <Input id="size" {...register("size")} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="materialIds">Materials</FieldLabel>
                  <MaterialPicker
                    values={materialIds}
                    onChange={(next) => setValue("materialIds", next)}
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="colorIds">Colors</FieldLabel>
                <ColorPicker values={colorIds} onChange={(next) => setValue("colorIds", next)} />
                {errors.colorIds && <FieldError>{errors.colorIds.message}</FieldError>}
              </Field>
            </div>
          </div>
        </div>

        {/* Row 2: the rest, full width, no reason to keep squeezing these
            into a narrow column once the photo's height is behind us. */}
        <div className="grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-2">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <SectionEyebrow>Organize</SectionEyebrow>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_9rem]">
                <Field>
                  <FieldLabel htmlFor="tags">Tags</FieldLabel>
                  <TagPicker values={tags} onChange={(next) => setValue("tags", next)} max={20} />
                  {errors.tags && <FieldError>{errors.tags.message}</FieldError>}
                </Field>
                <Field>
                  <FieldLabel htmlFor="visibility">Visibility</FieldLabel>
                  <Select
                    value={visibility}
                    onValueChange={(v) => setValue("visibility", v as ItemVisibility)}
                  >
                    <SelectTrigger id="visibility" className="w-full">
                      <SelectValue>
                        {(v: ItemVisibility) => (v === "public" ? "Public" : "Private")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <SectionEyebrow>Provenance</SectionEyebrow>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="purchaseDate">Purchase date</FieldLabel>
                  <DatePicker
                    id="purchaseDate"
                    value={purchaseDate}
                    onChange={(next) => setValue("purchaseDate", next)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="price">Price</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon className="pr-0">
                      <CurrencySelect
                        value={currency}
                        onChange={(next) => setValue("currency", next)}
                        triggerClassName="h-6 gap-1 border-0 bg-transparent px-1.5 shadow-none focus-visible:ring-0 dark:bg-transparent"
                      />
                    </InputGroupAddon>
                    <InputGroupInput
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register("price")}
                    />
                  </InputGroup>
                  {errors.price && <FieldError>{errors.price.message}</FieldError>}
                </Field>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <SectionEyebrow>Notes</SectionEyebrow>
            <Field>
              <Textarea
                id="notes"
                placeholder="Fit, care, anything worth remembering…"
                className="min-h-32"
                {...register("notes")}
              />
              {errors.notes && <FieldError>{errors.notes.message}</FieldError>}
            </Field>
          </div>
        </div>
      </div>
    </form>
  );
}
