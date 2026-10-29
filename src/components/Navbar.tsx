"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "./Logo";
import { translate } from "@/lib/i18n";
import { useCurrentLocale } from "@/components/LocaleProvider";
import {
  Menu,
  X,
  ArrowRight,
  User,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  ChevronDown,
} from "lucide-react";

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
  companyName?: string;
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const locale = useCurrentLocale();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/");
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const isStaff = user && user.role !== "CLIENT";
  const staffHome = user && ["ANALYST", "TRAINEE"].includes(user.role) ? "/employee" : "/admin";
  const staffWork = user?.role === "PROJECT_LEAD" ? "/admin/projects" : ["ANALYST", "TRAINEE"].includes(user?.role || "") ? "/employee/tasks" : "/admin/requests";

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <div className="flex-shrink-0">
            <Logo width={190} height={48} />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors ${
                pathname === "/"
                  ? "text-blue-600 font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {translate(locale, "home")}
            </Link>
            <Link
              href="/services"
              className={`text-sm font-medium transition-colors ${
                pathname.startsWith("/services")
                  ? "text-blue-600 font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {translate(locale, "services")}
            </Link>
            <Link
              href="/how-it-works"
              className={`text-sm font-medium transition-colors ${
                pathname === "/how-it-works"
                  ? "text-blue-600 font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {translate(locale, "howItWorks")}
            </Link>
            <Link
              href="/security"
              className={`text-sm font-medium transition-colors ${
                pathname === "/security"
                  ? "text-blue-600 font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {translate(locale, "confidentiality")}
            </Link>
            <Link
              href="/contact"
              className={`text-sm font-medium transition-colors ${
                pathname === "/contact"
                  ? "text-blue-600 font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {translate(locale, "contact")}
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {!loading && user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs">
                    {user.name.charAt(0)}
                  </div>
                  <span className="max-w-[130px] truncate text-slate-800">{user.name}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {dropdownOpen && (
                  <div
                    onMouseLeave={() => setDropdownOpen(false)}
                    className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs text-slate-500">{locale === "ar" ? "مسجل الدخول باسم" : "Signed in as"}</p>
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {user.companyName || user.email}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-50 text-blue-700">
                        {user.role.replace(/_/g, " ")}
                      </span>
                    </div>

                    {isStaff ? (
                      <Link
                        href={staffHome}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        {translate(locale, "adminPanel")}
                      </Link>
                    ) : (
                      <Link
                        href="/client"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-blue-600" />
                        {translate(locale, "clientPortal")}
                      </Link>
                    )}

                    <Link
                      href={isStaff ? staffWork : "/client/requests"}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <span>{translate(locale, "requests")}</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors border-t border-slate-100 mt-1"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      {translate(locale, "signOut")}
                    </button>
                  </div>
                )}
              </div>
            ) : !loading ? (
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/request-service"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow transition-all"
                >
                  <span>Request a Service</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            ) : null}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/request-service"
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-600 text-white"
            >
              Request
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-3">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            {translate(locale, "home")}
          </Link>
          <Link
            href="/services"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            {translate(locale, "services")}
          </Link>
          <Link
            href="/how-it-works"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            {translate(locale, "howItWorks")}
          </Link>
          <Link
            href="/security"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            {locale === "ar" ? "السرية والأمان" : "Confidentiality & Security"}
          </Link>
          <Link
            href="/contact"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            {translate(locale, "contact")}
          </Link>

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  href={isStaff ? "/admin" : "/client"}
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#0b2545]"
                >
                  {isStaff ? "Admin Operations Portal" : "Client Dashboard"}
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-center px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg"
                >
                  {translate(locale, "signOut")}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center px-4 py-2.5 rounded-lg text-sm font-medium text-slate-700 border border-slate-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/request-service"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600"
                >
                  Request a Service
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
