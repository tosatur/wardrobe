"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSession } from "@/lib/auth-client";
import { updateProfile, changeEmail, changePassword } from "@/lib/users-client";
import { AvatarUpload } from "@/components/avatar-upload";
import { ThemeToggle } from "@/components/theme-toggle";
import { CurrencySelect } from "@/components/currency-select";
import { LocationPicker } from "@/components/location-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QueryError } from "@/components/query-error";
import { useMinDurationPending } from "@/hooks/use-min-duration-pending";
import type { GeocodeResultDto } from "@wardrobe/shared";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const {
    data: session,
    isPending: isSessionQueryPending,
    isError,
    refetch,
  } = useQuery({ queryKey: ["session"], queryFn: getSession });
  const isPending = useMinDurationPending(isSessionQueryPending);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Only seeds the form fields once, the first time the session loads - a
  // later refetch (after saving) shouldn't clobber whatever the user is
  // mid-typing in the same form.
  const didSeedRef = useRef(false);
  useEffect(() => {
    if (session && !didSeedRef.current) {
      didSeedRef.current = true;
      setName(session.user.name);
      setEmail(session.user.email);
    }
  }, [session]);

  function refreshSession() {
    return queryClient.invalidateQueries({ queryKey: ["session"] });
  }

  async function handleAccountSubmit(event: FormEvent) {
    event.preventDefault();
    if (!session) return;

    if (name !== session.user.name) {
      const { error } = await updateProfile({ name });
      if (error) {
        toast.error(error);
        return;
      }
    }
    if (email !== session.user.email) {
      if (!emailPassword) {
        toast.error("Enter your current password to change your email.");
        return;
      }
      const { error } = await changeEmail(email, emailPassword);
      if (error) {
        toast.error(error);
        return;
      }
      setEmailPassword("");
    }
    toast.success("Account updated.");
    void refreshSession();
  }

  async function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault();
    const { error } = await changePassword(currentPassword, newPassword);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Password changed.");
    setCurrentPassword("");
    setNewPassword("");
  }

  async function handleSelectLocation(result: GeocodeResultDto) {
    const { error } = await updateProfile({
      locationName: result.name,
      locationLat: result.lat,
      locationLon: result.lon,
    });
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Location updated.");
    void refreshSession();
  }

  async function handleClearLocation() {
    const { error } = await updateProfile({
      locationName: null,
      locationLat: null,
      locationLon: null,
    });
    if (error) {
      toast.error(error);
      return;
    }
    void refreshSession();
  }

  async function handleCurrencyChange(defaultCurrency: string) {
    const { error } = await updateProfile({ defaultCurrency });
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Default currency updated.");
    void refreshSession();
  }

  if (isPending) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8">
        <div className="mb-6 grid w-full grid-cols-2 gap-1 rounded-md bg-muted p-1">
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-full" />
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="size-20 rounded-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-20" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8">
        <QueryError onRetry={() => void refetch()} className="py-12" />
      </main>
    );
  }

  if (!session) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8">
        <p className="text-sm text-muted-foreground">You must be logged in to view this page.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <Tabs defaultValue="account" className="animate-in fade-in-0 duration-200 motion-reduce:animate-none">
        <TabsList className="w-full">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile picture</CardTitle>
            </CardHeader>
            <CardContent>
              <AvatarUpload
                currentImageUrl={session.user.image}
                name={session.user.name}
                onUploaded={() => void refreshSession()}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => void handleAccountSubmit(e)}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="profile-name">Name</FieldLabel>
                    <Input
                      id="profile-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="profile-email">Email</FieldLabel>
                    <Input
                      id="profile-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Field>
                  {email !== session.user.email && (
                    <Field>
                      <FieldLabel htmlFor="profile-email-password">Current password</FieldLabel>
                      <Input
                        id="profile-email-password"
                        type="password"
                        value={emailPassword}
                        onChange={(e) => setEmailPassword(e.target.value)}
                        required
                      />
                      <FieldDescription>Confirm your password to change your email.</FieldDescription>
                    </Field>
                  )}
                  <Button type="submit">Save account</Button>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => void handlePasswordSubmit(e)}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="profile-current-password">Current password</FieldLabel>
                    <Input
                      id="profile-current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="profile-new-password">New password</FieldLabel>
                    <Input
                      id="profile-new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </Field>
                  <Button type="submit">Change password</Button>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">Used to show weather on the calendar.</p>
              <LocationPicker
                value={session.user.locationName}
                onChange={(result) => void handleSelectLocation(result)}
              />
              {session.user.locationName && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleClearLocation()}
                >
                  Clear location
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Currency</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Field>
                <FieldLabel htmlFor="profile-currency">Default currency</FieldLabel>
                <p className="text-sm text-muted-foreground">
                  Used to prefill new items&apos; price currency.
                </p>
                <CurrencySelect
                  id="profile-currency"
                  value={session.user.defaultCurrency}
                  onChange={(next) => void handleCurrencyChange(next)}
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
            </CardHeader>
            <CardContent>
              <ThemeToggle />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
