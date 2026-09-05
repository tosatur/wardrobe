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
import { deleteOutfit } from "@/lib/outfits-client";

export function DeleteOutfitDialog({
  outfitId,
  open,
  onOpenChange,
  onDeleted,
}: {
  outfitId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const pending = useMinDurationPending(isDeleting);

  async function handleDelete() {
    setIsDeleting(true);
    const { error } = await deleteOutfit(outfitId);
    setIsDeleting(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Outfit deleted.");
    void queryClient.invalidateQueries({ queryKey: ["outfits"] });
    onOpenChange(false);
    onDeleted?.();
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this outfit?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the outfit. This can&apos;t be undone.
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
