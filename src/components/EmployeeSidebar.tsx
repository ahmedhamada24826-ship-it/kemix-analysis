"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, CheckSquare, FolderOpen, Users, Headphones,
  Bell, LogOut, ChevronLeft, ChevronRight, Building2
} from "lucide-react";
import { SessionUser } from "@/lib/auth";
import { Logo } from "./Logo";
import { translate } from "@/lib/i18n";
import { useCurrentLocale } from "@/components/LocaleProvider";

interface Props {
  session: SessionUser;
  unreadCount: number;
}

export default function EmployeeSidebar({ session, unreadCount }: Props) {
  const locale = useCurrentLocale();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navLinks = [
    { href: "/employee", label: translate(locale, "overview"), icon: LayoutDashboard, exact: true },
    { href: "/employee/tasks", label: translate(locale, "tasks"), icon: CheckSquare },
    { href: "/employee/projects", label: translate(locale, "myProjects"), icon: FolderOpen },
    { href: "/employee/team", label: translate(locale, "team"), icon: Users },
    ...(["SUPER_ADMIN", "OPERATIONS_MANAGER", "PROJECT_LEAD", "SUPPORT_AGENT"].includes(session.role)
      ? [{ href: "/admin", label: translate(locale, "adminPanel"), icon: Building2 }]
      : []),
  ];

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const roleLabelKey: Record<string, string> = {
    SUPER_ADMIN: "superAdmin", OPERATIONS_MANAGER: "operationsManager", PROJECT_LEAD: "projectLead",
    ANALYST: "analyst", TRAINEE: "trainee", SUPPORT_AGENT: "supportAgent",
  };
  const initials = session.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/auth/login";
  }

  return (
    <aside
      className={`flex flex-col bg-[#0b2545] text-white transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      } min-h-screen flex-shrink-0`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
        {!collapsed && (
          <Link href="/employee" className="flex items-center gap-2">
            <div className="scale-75 origin-left">
              <Logo width={160} height={40} />
            </div>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors ml-auto"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navLinks.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
              isActive(href, exact)
                ? "bg-[#0066ff] text-white"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
      </nav>

      {/* Bottom: Notifications + User */}
      <div className="border-t border-white/10 p-3 space-y-2">
        <Link
          href="/employee/notifications"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm"
          title={collapsed ? translate(locale, "notifications") : undefined}
        >
          <div className="relative flex-shrink-0">
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#ff7a00] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          {!collapsed && <span>{translate(locale, "notifications")} {unreadCount > 0 && `(${unreadCount})`}</span>}
        </Link>

        <div className={`flex items-center gap-3 px-2 py-2 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-full bg-[#0066ff] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{session.name}</p>
                <p className="text-[11px] text-white/50 truncate">{translate(locale, roleLabelKey[session.role] || session.role)}</p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-white/60 hover:text-red-400 hover:bg-white/10 transition-colors text-sm w-full ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && <span>{translate(locale, "signOut")}</span>}
        </button>
      </div>
    </aside>
  );
}
