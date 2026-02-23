"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserCircleIcon, GearIcon, InfoCircleIcon, SignOutIcon } from "@/components/icons";
import { useLogout } from "@/hooks/use-auth";

interface AdminUserMenuProps {
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
  contextLabel?: string;
  settingsHref: string;
}

export function AdminUserMenu({ user, settingsHref }: AdminUserMenuProps) {
  const router = useRouter();
  const logoutMutation = useLogout();
  const itemClassName =
    "group rounded-sm px-3 py-2 data-[highlighted]:bg-primary/10 data-[highlighted]:text-primary focus:bg-primary/10 focus:text-primary";

  const handleSignOut = async () => {
    await logoutMutation.mutateAsync();
    router.replace("/login");
  };

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none"
          suppressHydrationWarning
        >
          <span className="overflow-hidden rounded-full h-11 w-11 shrink-0">
            <Avatar className="h-11 w-11 rounded-full">
              <AvatarImage src={user?.avatarUrl} className="object-cover" />
              <AvatarFallback className="text-sm font-medium">{initials}</AvatarFallback>
            </Avatar>
          </span>
          <span className="hidden lg:block text-sm font-medium text-foreground mr-0.5">
            {user?.name?.split(" ")[0] || "Admin"}
          </span>
          <ChevronDown className="hidden lg:block h-4 w-4 text-muted-foreground/70" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="mt-4 flex w-[260px] flex-col rounded-sm border border-border bg-background p-3 shadow-lg"
      >
        {/* User info */}
        <div className="pb-3 border-b border-border">
          <span className="block font-medium text-sm text-foreground">
            {user?.name || "Admin"}
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {user?.email || "admin@example.com"}
          </span>
        </div>

        {/* Menu items */}
        <ul className="flex flex-col gap-0.5 pt-3 pb-3 border-b border-border">
          <li>
            <DropdownMenuItem asChild className={itemClassName}>
              <Link
                href="/profile"
                className="flex items-center gap-3 text-sm font-medium text-inherit transition-colors cursor-pointer"
              >
                <UserCircleIcon className="h-5 w-5 text-current opacity-70 transition-opacity group-hover:opacity-100" />
                Edit profile
              </Link>
            </DropdownMenuItem>
          </li>
          <li>
            <DropdownMenuItem asChild className={itemClassName}>
              <Link
                href={settingsHref}
                className="flex items-center gap-3 text-sm font-medium text-inherit transition-colors cursor-pointer"
              >
                <GearIcon className="h-5 w-5 text-current opacity-70 transition-opacity group-hover:opacity-100" />
                Account settings
              </Link>
            </DropdownMenuItem>
          </li>
          <li>
            <DropdownMenuItem asChild className={itemClassName}>
              <Link
                href="/settings"
                className="flex items-center gap-3 text-sm font-medium text-inherit transition-colors cursor-pointer"
              >
                <InfoCircleIcon className="h-5 w-5 text-current opacity-70 transition-opacity group-hover:opacity-100" />
                Support
              </Link>
            </DropdownMenuItem>
          </li>
        </ul>

        {/* Sign out */}
        <DropdownMenuItem asChild className={itemClassName}>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-3 flex w-full items-center gap-3 text-sm font-medium text-inherit transition-colors cursor-pointer"
          >
            <SignOutIcon className="h-5 w-5 text-current opacity-70 transition-opacity group-hover:opacity-100" />
            Sign out
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
