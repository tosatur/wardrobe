import { ItemForm } from "@/components/item-form";
import { DetailPageShell } from "@/components/detail-page-shell";

export default function NewItemPage() {
  return (
    <DetailPageShell>
      <ItemForm backHref="/items" />
    </DetailPageShell>
  );
}
