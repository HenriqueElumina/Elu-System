"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/auth/roles";
import { navLinksForRole } from "@/lib/nav/links";
import { LogoutButton } from "@/components/logout-button";

const ROLE_LABEL: Record<UserRole, string> = {
  socio: "Sócio",
  financeiro: "Financeiro",
  gestor: "Gestor",
  colaborador: "Colaborador",
  freelancer: "Freelancer",
  cliente: "Cliente",
};

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function SidebarContent({
  userName,
  userRole,
  onNavigate,
}: {
  userName: string;
  userRole: UserRole;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const links = navLinksForRole(userRole);

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-6 pt-8">
        <Image
          src="/logo-light.png"
          alt="Elumina Partners"
          width={160}
          height={160}
          className="h-auto w-32"
          priority
        />
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {links.map((link) => {
          const active = isActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-cream text-brand-charcoal"
                  : "text-brand-cream/80 hover:bg-white/5 hover:text-brand-cream"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <p className="truncate text-sm font-medium text-brand-cream">
          {userName}
        </p>
        <p className="mb-3 text-xs text-brand-cream/60">
          {ROLE_LABEL[userRole] ?? userRole}
        </p>
        <LogoutButton className="w-full rounded-md border border-white/15 px-3 py-1.5 text-left text-sm text-brand-cream/80 hover:bg-white/5 hover:text-brand-cream" />
      </div>
    </div>
  );
}

export function AppShell({
  userName,
  userRole,
  children,
}: {
  userName: string;
  userRole: UserRole;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="lg:flex lg:min-h-screen">
      {/* Barra mobile */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-brand-charcoal px-4 py-3 lg:hidden">
        <Image
          src="/logo-light.png"
          alt="Elumina Partners"
          width={120}
          height={120}
          className="h-auto w-20"
        />
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
          className="rounded-md p-2 text-brand-cream hover:bg-white/10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-6 w-6"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-72 bg-brand-charcoal shadow-xl">
            <div className="flex justify-end px-3 pt-3">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar menu"
                className="rounded-md p-2 text-brand-cream hover:bg-white/10"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="h-6 w-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SidebarContent
              userName={userName}
              userRole={userRole}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Sidebar desktop */}
      <aside className="hidden lg:block lg:w-64 lg:shrink-0 lg:bg-brand-charcoal">
        <div className="lg:fixed lg:h-screen lg:w-64">
          <SidebarContent userName={userName} userRole={userRole} />
        </div>
      </aside>

      <main className="flex-1 bg-brand-cream lg:min-h-screen">
        <div className="m-3 rounded-lg bg-white shadow-sm sm:m-6 lg:m-8">
          {children}
        </div>
      </main>
    </div>
  );
}
