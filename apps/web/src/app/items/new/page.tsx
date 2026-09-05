import { ItemForm } from "@/components/item-form";

export default function NewItemPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <ItemForm backHref="/items" />
    </main>
  );
}
