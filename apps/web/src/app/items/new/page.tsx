import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ItemForm } from "@/components/item-form";

export default function NewItemPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Add an item</CardTitle>
          <CardDescription>Fill in what you know. You can always come back and add more.</CardDescription>
        </CardHeader>
        <CardContent>
          <ItemForm />
        </CardContent>
      </Card>
    </main>
  );
}
