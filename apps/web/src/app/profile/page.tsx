"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { getSession, type Session } from "@/lib/auth-client";
import { updateProfile, changeEmail, changePassword } from "@/lib/users-client";
import { geocodeSearch } from "@/lib/weather-client";
import { AvatarUpload } from "@/components/avatar-upload";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import type { GeocodeResultDto } from "@wardrobe/shared";

export default function ProfilePage() {
  const [session, setSession] = useState<Session | null | "pending">("pending");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState<GeocodeResultDto[]>([]);

  useEffect(() => {
    void getSession().then((s) => {
      setSession(s);
      if (s) {
        setName(s.user.name);
        setEmail(s.user.email);
        setLocationQuery(s.user.locationName ?? "");
      }
    });
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      void geocodeSearch(locationQuery).then(setLocationResults);
    }, 300);
    return () => clearTimeout(handle);
  }, [locationQuery]);

  async function handleAccountSubmit(event: FormEvent) {
    event.preventDefault();
    if (session === "pending" || !session) return;

    if (name !== session.user.name) {
      const { error } = await updateProfile({ name });
      if (error) {
        toast.error(error);
        return;
      }
    }
    if (email !== session.user.email) {
      const { error } = await changeEmail(email);
      if (error) {
        toast.error(error);
        return;
      }
    }
    toast.success("Account updated.");
    void getSession().then(setSession);
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
    setLocationQuery(result.name);
    setLocationResults([]);
    void getSession().then(setSession);
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
    setLocationQuery("");
    void getSession().then(setSession);
  }

  if (session === "pending") {
    return (
      <main className="mx-auto max-w-lg px-4 py-8">
        <Skeleton className="h-64 w-full" />
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
    <main className="mx-auto max-w-lg space-y-6 px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Profile picture</CardTitle>
        </CardHeader>
        <CardContent>
          <AvatarUpload
            currentImageUrl={session.user.image}
            name={session.user.name}
            onUploaded={() => void getSession().then(setSession)}
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
                <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} required />
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

      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">Used to show weather on the calendar.</p>
          <Input
            placeholder="Search for a city…"
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
          />
          {locationResults.length > 0 && (
            <ul className="divide-y divide-border rounded-sm border border-border">
              {locationResults.map((result, i) => (
                <li key={`${result.name}-${i}`}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => void handleSelectLocation(result)}
                  >
                    {result.name}
                    {result.admin1 ? `, ${result.admin1}` : ""}
                    {result.country ? `, ${result.country}` : ""}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {session.user.locationName && (
            <Button type="button" variant="ghost" size="sm" onClick={() => void handleClearLocation()}>
              Clear location
            </Button>
          )}
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
    </main>
  );
}
