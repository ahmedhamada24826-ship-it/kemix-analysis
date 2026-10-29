"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { useCurrentLocale } from "@/components/LocaleProvider";

type ManagerMessage = {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string; role: string; department: { name: string } | null };
};

export default function ManagementChatPage() {
  const locale = useCurrentLocale();
  const tr = (en: string, ar: string) => locale === "ar" ? ar : en;
  const [messages, setMessages] = useState<ManagerMessage[]>([]);
  const [userId, setUserId] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/management-chat", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || tr("Could not load messages.", "تعذر تحميل الرسائل."));
    setMessages(data.messages || []);
  }, [locale]);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me").then((r) => r.json()).then((data) => {
      if (active) setUserId(data.user?.id || "");
    }).catch(() => undefined);
    load().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : tr("Could not load messages.", "تعذر تحميل الرسائل.")));
    const interval = setInterval(() => {
      load().catch(() => undefined);
    }, 5000);
    return () => { active = false; clearInterval(interval); };
  }, [load, locale]);

  async function send(event: FormEvent) {
    event.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/management-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || tr("Could not send message.", "تعذر إرسال الرسالة."));
      setText("");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : tr("Could not send message.", "تعذر إرسال الرسالة."));
    } finally {
      setSending(false);
    }
  }

  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"} className="mx-auto flex h-[calc(100vh-9rem)] max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center gap-3 border-b border-slate-200 p-5">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-700"><MessageSquare size={20} /></div>
        <div>
          <h1 className="text-lg font-bold text-[#0b2545]">{tr("Department Managers Chat", "محادثة مديري الأقسام")}</h1>
          <p className="mt-1 text-xs text-slate-500">{tr("Private coordination space for department leads and operations management.", "مساحة تنسيق خاصة بقادة الأقسام ومديري العمليات.")}</p>
        </div>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-5" aria-live="polite">
        {messages.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">{tr("No messages yet. Start the coordination here.", "لا توجد رسائل بعد. ابدأ التنسيق من هنا.")}</div>
        ) : messages.map((message) => {
          const mine = message.sender.id === userId;
          return (
            <article key={message.id} className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${mine ? "ms-auto bg-blue-600 text-white" : "me-auto border border-slate-200 bg-white text-slate-800"}`}>
              <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] opacity-75">
                <span className="font-bold">{mine ? tr("You", "أنت") : message.sender.name}</span>
                {message.sender.department?.name && <span>{message.sender.department.name}</span>}
                <time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString(locale === "ar" ? "ar-EG" : "en-GB", { dateStyle: "short", timeStyle: "short" })}</time>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
            </article>
          );
        })}
      </div>

      <form onSubmit={send} className="border-t border-slate-200 p-4">
        {error && <p role="alert" className="mb-2 text-xs text-rose-600">{error}</p>}
        <div className="flex items-end gap-3">
          <textarea value={text} onChange={(event) => setText(event.target.value)} maxLength={5000} rows={2} placeholder={tr("Write a message for the department leads…", "اكتب رسالة لقادة الأقسام…")} className="min-h-12 flex-1 resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          <button type="submit" disabled={!text.trim() || sending} className="inline-flex h-12 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
            <Send size={16} /> <span>{sending ? tr("Sending…", "جارٍ الإرسال…") : tr("Send", "إرسال")}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
