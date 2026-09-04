import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const API_URL = process.env.API_URL ?? "http://127.0.0.1:3001";

type Health = {
  status: string;
  dbConnected: boolean;
  userCount: number;
};

async function getHealth(): Promise<Health | { error: string }> {
  try {
    const res = await fetch(`${API_URL}/health`, { cache: "no-store" });
    if (!res.ok) throw new Error(`API responded with ${res.status}`);
    return (await res.json()) as Health;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export default async function HomePage() {
  const health = await getHealth();
  const dbConnected = "dbConnected" in health && health.dbConnected;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 font-heading text-2xl font-black tracking-tight uppercase">
        Wardrobe Manager
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>System status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">DB connected: {String(dbConnected)}</p>
          <pre className="rounded-md bg-muted p-3 text-xs">{JSON.stringify(health, null, 2)}</pre>
        </CardContent>
      </Card>
    </main>
  );
}
