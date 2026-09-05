import { ItemForm } from "@/components/item-form";
import { RouteModal } from "@/components/route-modal";

export default function InterceptedNewItemPage() {
  return (
    <RouteModal title="Add an item" hideHeader showCloseButton={false}>
      <ItemForm />
    </RouteModal>
  );
}
