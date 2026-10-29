import Link from "next/link";
import { Logo } from "./Logo";
import { ShieldCheck, Mail, MapPin, Phone, ArrowUpRight, Lock } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#07182c] text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white/95 p-2 rounded-lg inline-block">
              <Logo width={180} height={44} />
            </div>
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
              KEMIX Analysis is the specialized data analytics, business intelligence, and
              decision-engineering delivery arm of the KEMIX ecosystem. Turning complex data into
              clear, profitable business decisions.
            </p>
            <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-950/60 border border-blue-800/40 px-3 py-1.5 rounded-md w-fit">
              <Lock className="w-3.5 h-3.5" />
              <span>Strict Non-Disclosure & Enterprise Data Isolation</span>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">
              Services
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/services#data-analysis"
                  className="hover:text-blue-400 transition-colors"
                >
                  Data Analysis & Reporting
                </Link>
              </li>
              <li>
                <Link
                  href="/services#business-intelligence"
                  className="hover:text-blue-400 transition-colors"
                >
                  Power BI Dashboards
                </Link>
              </li>
              <li>
                <Link
                  href="/services#automation"
                  className="hover:text-blue-400 transition-colors"
                >
                  SQL, Python & ETL Automation
                </Link>
              </li>
              <li>
                <Link
                  href="/services#forecasting"
                  className="hover:text-blue-400 transition-colors"
                >
                  Forecasting & Predictive ML
                </Link>
              </li>
              <li>
                <Link
                  href="/request-service"
                  className="text-orange-400 hover:text-orange-300 transition-colors font-medium flex items-center gap-1 mt-1"
                >
                  <span>Custom Project Intake</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">
              Platform
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/how-it-works" className="hover:text-blue-400 transition-colors">
                  How It Works (10-Step Flow)
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-blue-400 transition-colors">
                  Confidentiality & Security
                </Link>
              </li>
              <li>
                <Link href="/client" className="hover:text-blue-400 transition-colors">
                  Client Portal
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-blue-400 transition-colors">
                  Customer & Technical Support
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="hover:text-blue-400 transition-colors">
                  Staff Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">
              Inquiries
            </h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <span>contact@kemix-analysis.com</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <span>+966 50 123 4567</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <span>Riyadh & Dubai Business Hubs</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} KEMIX Analysis. All rights reserved. Turning Data into Business Decisions.</p>
          <div className="flex items-center gap-6">
            <Link href="/security" className="hover:text-slate-400 transition-colors">
              Data Protection & Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-400 transition-colors">
              Terms of Engagement
            </Link>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">RTL / Arabic Ready Architecture</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
