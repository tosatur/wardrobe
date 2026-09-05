"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { getSession, createUser } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { QueryError } from "@/components/query-error";

export default function AdminPage() {
  const { data: session, isPending, isError, refetch } = useQuery({
    queryKey: ["session"],
    queryFn: getSession,
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: createError } = await createUser(email, password, name);

    setSubmitting(false);
    if (createError) {
      setError(createError);
      return;
    }
    toast.success(`Created account for ${email}.`);
    setEmail("");
    setPassword("");
    setName("");
  }

  if (isPending) {
    return (
      <main className="mx-auto max-w-sm px-4 py-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-24" />
          </CardContent>
        </Card>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="mx-auto max-w-sm px-4 py-8">
        <QueryError onRetry={() => void refetch()} className="py-12" />
      </main>
    );
  }

  if (!session || session.user.role !== "admin") {
    return (
      <main className="mx-auto max-w-sm px-4 py-8">
        <EmptyState className="py-12 text-center">
          You must be an admin to view this page.
        </EmptyState>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create a user</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void onSubmit(e)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="admin-name">Name</FieldLabel>
                <Input
                  id="admin-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="admin-email">Email</FieldLabel>
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="admin-password">Initial password</FieldLabel>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </Field>
              {error && <FieldError>{error}</FieldError>}
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating…" : "Create user"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
