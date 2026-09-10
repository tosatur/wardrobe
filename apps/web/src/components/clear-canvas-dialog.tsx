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

/**
 * "Clear the canvas?" confirmation for the outfit builder's "Clear all"
 * button - same shape as DiscardChangesDialog, and the same default (not
 * destructive) variant, since clearing the in-progress canvas discards
 * unsaved arrangement rather than permanently deleting saved data.
 */
export function ClearCanvasDialog({
  open,
  onOpenChange,
  onClear,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClear: () => void;
}) {
  function handleClear() {
    onClear();
    onOpenChange(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear the canvas?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove all placed items from the canvas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep items</AlertDialogCancel>
          <AlertDialogAction onClick={handleClear}>Clear all</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
