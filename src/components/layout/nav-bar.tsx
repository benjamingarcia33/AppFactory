"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/scout", label: "Scout" },
  { href: "/architect", label: "Architect" },
  { href: "/blueprint", label: "Blueprint" },
  { href: "/library", label: "Library" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border-subtle bg-background/80 backdrop-blur-xl">
      <div className="container flex h-14 items-center px-6">
        <Link href="/" className="mr-8 flex items-center space-x-2">
          <span className="text-lg font-bold tracking-tight">AppFoundry</span>
        </Link>
        <nav className="flex items-center space-x-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative px-3 py-2 text-sm font-medium rounded-md transition-colors",
                pathname.startsWith(item.href)
                  ? "text-foreground after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-4/5 after:h-0.5 after:bg-primary after:rounded-full"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
