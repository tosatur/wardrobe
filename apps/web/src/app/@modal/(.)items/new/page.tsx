import { ItemForm } from "@/components/item-form";
import { RouteModal } from "@/components/route-modal";

export default function InterceptedNewItemPage() {
  return (
    <RouteModal
      title="Add an item"
      description="Fill in what you know. You can always come back and add more."
      hideHeader
    >
      <ItemForm />
    </RouteModal>
  );
}
