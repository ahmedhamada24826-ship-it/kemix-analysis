"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { translate } from "@/lib/i18n";
import { useCurrentLocale } from "@/components/LocaleProvider";
import type { Role } from "@/lib/auth";
import {
  LayoutDashboard,
  Inbox,
  Briefcase,
  FileCheck,
  Users,
  Headphones,
  ShieldCheck,
  Bell,
  LogOut,
  Menu,
  X,
  Building2,
  UserPlus,
  MessageSquare,
} from "lucide-react";

type AdminUser = { id: string; name: string; role: Role; isDepartmentLead?: boolean };
type AdminNotification = { id: string; title: string; message: string; createdAt: string };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const locale = useCurrentLocale();

  useEffect(() => {
    async function loadAdminSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/auth/login");
          return;
        }
        const data = await res.json();
        if (data.user.role === "CLIENT") {
          router.push("/client");
          return;
        }
        if (["ANALYST", "TRAINEE"].includes(data.user.role)) {
          router.push("/employee");
          return;
        }
        setUser(data.user as AdminUser);
        if (pathname === "/admin" && data.user.role === "SUPPORT_AGENT") {
          router.replace("/admin/requests");
          return;
        }
        if (pathname === "/admin" && data.user.role === "PROJECT_LEAD") {
          router.replace("/admin/projects");
          return;
        }
        setUnreadCount(data.unreadNotifications || 0);

        const notifRes = await fetch("/api/notifications");
        if (notifRes.ok) {
          const nData = await notifRes.json();
          setNotifications((nData.notifications || []) as AdminNotification[]);
        }
      } catch {
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    }
    loadAdminSession();
  }, [pathname, router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const navItems = [
    { label: translate(locale, "overview"), href: "/admin", icon: LayoutDashboard },
    { label: translate(locale, "requests"), href: "/admin/requests", icon: Inbox },
    { label: translate(locale, "proposals"), href: "/admin/proposals", icon: FileCheck },
    { label: translate(locale, "projects"), href: "/admin/projects", icon: Briefcase },
    { label: translate(locale, "clients"), href: "/admin/clients", icon: Users },
    { label: translate(locale, "support"), href: "/admin/support", icon: Headphones },
    { label: translate(locale, "contactInquiries"), href: "/admin/contact-inquiries", icon: Inbox },
    { label: translate(locale, "staff"), href: "/admin/staff", icon: ShieldCheck },
    { label: translate(locale, "departments"), href: "/admin/departments", icon: Building2 },
    { label: translate(locale, "invites"), href: "/admin/invites", icon: UserPlus },
    { label: translate(locale, "managementChat"), href: "/admin/management-chat", icon: MessageSquare },
  ];
  const visibleNavItems = navItems.filter((item) => {
    if (user?.role === "SUPER_ADMIN" || user?.role === "OPERATIONS_MANAGER") return true;
    if (user?.role === "SUPPORT_AGENT") {
      return ["/admin/requests", "/admin/proposals", "/admin/projects", "/admin/clients", "/admin/support", "/admin/contact-inquiries"].includes(item.href);
    }
    if (user?.role === "PROJECT_LEAD") return item.href === "/admin/projects" || (user.isDepartmentLead && ["/admin/staff", "/admin/management-chat"].includes(item.href));
    return false;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-400 text-xs">
        Verifying administrative credentials...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#07182c] text-slate-300 border-r border-slate-800">
        <div className="p-4 border-b border-slate-800 bg-white/95">
          <Logo width={180} height={44} href="/admin" />
        </div>

        <div className="p-4 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {locale === "ar" ? "إدارة الموظفين" : "Staff Operations"}
            </p>
          </div>
          <p className="text-sm font-bold text-white truncate mt-1">{user?.name}</p>
          <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-300">
            {user?.role?.replace(/_/g, " ")}
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <span>View Public Site ↗</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>{translate(locale, "signOut")}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:block">
              Operations Control Panel
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-orange-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="font-bold text-xs text-slate-900">Operations Feed</span>
                    <span className="text-[10px] text-slate-400">Live Intake Alerts</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 py-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">No notifications.</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="py-2.5 text-xs space-y-0.5">
                          <p className="font-semibold text-slate-900">{n.title}</p>
                          <p className="text-slate-600 text-[11px]">{n.message}</p>
                          <span className="text-[10px] text-slate-400">
                            {new Date(n.createdAt).toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                {user?.name?.charAt(0)}
              </div>
              <div className="hidden sm:block text-left text-xs">
                <span className="font-semibold text-slate-900 block truncate max-w-[120px]">
                  {user?.name}
                </span>
                <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">
                  {user?.role?.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          </div>
        </header>

        {mobileOpen && (
          <div className="lg:hidden bg-[#07182c] text-white p-4 space-y-2 border-b border-slate-800">
            {visibleNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-sm font-semibold rounded-lg hover:bg-white/10"
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-sm font-semibold text-rose-400"
            >
              {translate(locale, "signOut")}
            </button>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
