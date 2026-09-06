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

export function DeleteEntityDialog({
  open,
  onOpenChange,
  onDeleted,
  title,
  description,
  successMessage,
  invalidateQueryKey,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
  title: string;
  description: string;
  successMessage: string;
  invalidateQueryKey: string[];
  onDelete: () => Promise<{ error: string | null }>;
}) {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const pending = useMinDurationPending(isDeleting);

  async function handleDelete() {
    setIsDeleting(true);
    const { error } = await onDelete();
    setIsDeleting(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(successMessage);
    void queryClient.invalidateQueries({ queryKey: invalidateQueryKey });
    onOpenChange(false);
    onDeleted?.();
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
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
