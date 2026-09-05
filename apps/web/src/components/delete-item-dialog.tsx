"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import { useMinDurationPending } from "@/hooks/use-min-duration-pending";
import { deleteItem } from "@/lib/items-client";

export function DeleteItemDialog({
  itemId,
  open,
  onOpenChange,
  onDeleted,
}: {
  itemId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const pending = useMinDurationPending(isDeleting);

  async function handleDelete() {
    setIsDeleting(true);
    const { error } = await deleteItem(itemId);
    setIsDeleting(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Item deleted.");
    void queryClient.invalidateQueries({ queryKey: ["items"] });
    onOpenChange(false);
    onDeleted?.();
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this item?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the item and its photo. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={pending} onClick={() => void handleDelete()}>
            {pending && <Spinner data-icon="inline-start" />}
            {pending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
