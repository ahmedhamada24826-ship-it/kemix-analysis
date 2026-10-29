"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  FileCheck,
  FolderDown,
  Headphones,
  Bell,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { translate } from "@/lib/i18n";
import { useCurrentLocale } from "@/components/LocaleProvider";

type ClientUser = { id: string; name: string; email: string; companyName?: string | null; clientType?: string };
type ClientNotification = { id: string; title: string; message: string; createdAt: string | Date };

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<ClientUser | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const locale = useCurrentLocale();

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/auth/login");
          return;
        }
        const data = await res.json();
        setUser(data.user);
        setUnreadNotifications(data.unreadNotifications || 0);

        // Fetch notifications
        const notifRes = await fetch("/api/notifications");
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          setNotifications(notifData.notifications || []);
        }
      } catch {
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, [pathname, router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const markNotificationsAsRead = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadNotifications > 0) {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setUnreadNotifications(0);
    }
  };

  const navItems = [
    { label: translate(locale, "overview"), href: "/client", icon: LayoutDashboard },
    { label: translate(locale, "requests"), href: "/client/requests", icon: FileText },
    { label: translate(locale, "myProjects"), href: "/client/projects", icon: Briefcase },
    { label: translate(locale, "proposals"), href: "/client/proposals", icon: FileCheck },
    { label: locale === "ar" ? "التسليمات" : "Deliverables", href: "/client/deliverables", icon: FolderDown },
    { label: translate(locale, "support"), href: "/client/support", icon: Headphones },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        {translate(locale, "authenticatingClient")}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#0b2545] text-slate-300 border-r border-slate-800">
        <div className="p-5 border-b border-slate-800 bg-white/95">
          <Logo width={180} height={44} href="/client" />
        </div>

        <div className="p-4 border-b border-slate-800/80 bg-slate-900/40">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {translate(locale, "clientPortal")}
          </p>
          <p className="text-sm font-bold text-white truncate mt-0.5">
            {user?.companyName || user?.name}
          </p>
          <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-500/20 text-blue-300">
            {user?.clientType === "INDIVIDUAL" ? (locale === "ar" ? "عميل فردي" : "Individual Client") : (locale === "ar" ? "عميل مؤسسي" : "Enterprise Client")}
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/client"
                ? pathname === "/client"
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

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <Link
            href="/request-service"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
          >
            <span>+ {translate(locale, "newServiceRequest")}</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>{translate(locale, "signOut")}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-base font-bold text-[#0b2545] hidden sm:block">
              {translate(locale, "clientWorkspace")}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={markNotificationsAsRead}
                className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label={translate(locale, "notifications")}
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-orange-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="font-bold text-xs text-slate-900">{translate(locale, "notifications")}</span>
                    <span className="text-[11px] text-slate-400">{translate(locale, "activityLog")}</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 py-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">{translate(locale, "noNotifications")}</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="py-2.5 text-xs space-y-1">
                          <p className="font-semibold text-slate-900">{n.title}</p>
                          <p className="text-slate-600 text-[11px]">{n.message}</p>
                          <span className="text-[10px] text-slate-400">
                            {new Date(n.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                {user?.name?.charAt(0)}
              </div>
              <div className="hidden sm:block text-left text-xs">
                <span className="font-semibold text-slate-900 block truncate max-w-[120px]">
                  {user?.name}
                </span>
                <span className="text-[11px] text-slate-400 block truncate max-w-[120px]">
                  {user?.email}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0b2545] text-white p-4 space-y-2 border-b border-slate-800">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-semibold rounded-lg hover:bg-white/10"
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-sm font-semibold text-rose-400 hover:bg-rose-500/10 rounded-lg"
            >
              {translate(locale, "signOut")}
            </button>
          </div>
        )}

        {/* Dynamic Client Page */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
