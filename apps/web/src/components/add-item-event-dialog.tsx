"use client";

import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ItemEventType } from "@wardrobe/shared";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { DatePicker } from "@/components/date-picker";
import { createItemEvent } from "@/lib/items-client";

const EVENT_TYPE_LABEL: Record<ItemEventType, string> = {
  wash: "Wash",
  alteration: "Alteration",
  damage: "Damage",
  repair: "Repair",
};

export function AddItemEventDialog({
  itemId,
  open,
  onOpenChange,
}: {
  itemId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [type, setType] = useState<ItemEventType>("wash");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setType("wash");
    setDate("");
    setDescription("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!date) {
      toast.error("Pick a date.");
      return;
    }
    setSubmitting(true);
    const { error } = await createItemEvent(itemId, {
      type,
      date,
      description: description || undefined,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Event logged.");
    void queryClient.invalidateQueries({ queryKey: ["item-history", itemId] });
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log an event</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="event-type">Type</FieldLabel>
              <Select value={type} onValueChange={(v) => setType(v as ItemEventType)}>
                <SelectTrigger id="event-type" className="w-full">
                  <SelectValue>{(v: ItemEventType) => EVENT_TYPE_LABEL[v]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(EVENT_TYPE_LABEL) as ItemEventType[]).map((value) => (
                    <SelectItem key={value} value={value}>
                      {EVENT_TYPE_LABEL[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="event-date">Date</FieldLabel>
              <DatePicker id="event-date" value={date} onChange={setDate} />
            </Field>
            <Field>
              <FieldLabel htmlFor="event-description">Description</FieldLabel>
              <Textarea
                id="event-description"
                placeholder="Optional details…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Log event"}
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
