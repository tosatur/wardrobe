"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSession, signOut, API_URL, type Session } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

export function AuthStatus() {
  const [session, setSession] = useState<Session | null | "pending">("pending");

  useEffect(() => {
    void getSession().then(setSession);
  }, []);

  if (session === "pending") return <Skeleton className="size-8 rounded-full" />;

  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" render={<Link href="/login">Log in</Link>} />
        <Button size="sm" render={<Link href="/register">Register</Link>} />
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu" />}
      >
        <Avatar>
          {session.user.image && (
            <AvatarImage
              src={`${API_URL}${session.user.image}`}
              crossOrigin="use-credentials"
              alt={session.user.name}
            />
          )}
          <AvatarFallback>{initials(session.user.name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{session.user.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link href="/profile">Profile</Link>} />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              void signOut().then(() => setSession(null));
            }}
          >
            Log out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
