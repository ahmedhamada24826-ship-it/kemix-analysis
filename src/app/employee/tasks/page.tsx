"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckSquare, Filter, Calendar, AlertTriangle } from "lucide-react";
import { translate } from "@/lib/i18n";
import { useCurrentLocale } from "@/components/LocaleProvider";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  completedAt: string | null;
  project: { id: string; referenceNumber: string; title: string };
  _count: { subTasks: number };
}

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "bg-red-100 text-red-700 border border-red-200",
  HIGH: "bg-orange-100 text-orange-700 border border-orange-200",
  MEDIUM: "bg-blue-100 text-blue-700 border border-blue-200",
  LOW: "bg-gray-100 text-gray-600 border border-gray-200",
};

const STATUS_COLORS: Record<string, string> = {
  TODO: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  REVIEW: "bg-yellow-100 text-yellow-700",
  DONE: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-400",
};

function formatDate(d: string | null, locale: "en" | "ar") {
  if (!d) return null;
  return new Date(d).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function statusKey(status: string) {
  return ({ ALL: "all", TODO: "todo", IN_PROGRESS: "inProgress", REVIEW: "review", DONE: "done", CANCELLED: "cancelled" } as Record<string, string>)[status] || status;
}

function priorityKey(priority: string) {
  return ({ ALL: "all", URGENT: "urgent", HIGH: "high", MEDIUM: "medium", LOW: "low" } as Record<string, string>)[priority] || priority;
}

function isOverdue(d: string | null) {
  if (!d) return false;
  return new Date(d) < new Date();
}

export default function MyTasksPage() {
  const locale = useCurrentLocale();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (priorityFilter !== "ALL") params.set("priority", priorityFilter);
    const res = await fetch(`/api/employee/tasks?${params}`);
    const data = await res.json();
    setTasks(data.tasks || []);
    setLoading(false);
  }, [statusFilter, priorityFilter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  async function markDone(taskId: string) {
    setUpdatingId(taskId);
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DONE" }),
    });
    await fetchTasks();
    setUpdatingId(null);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0b2545]">{translate(locale, "tasks")}</h1>
        <p className="text-gray-500 mt-1">{translate(locale, "tasksHelp")}</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-4 items-center">
        <Filter size={16} className="text-gray-400" />
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 font-medium">{translate(locale, "statusFilter")}</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0066ff]/30"
          >
            {["ALL", "TODO", "IN_PROGRESS", "REVIEW", "DONE"].map((s) => (
              <option key={s} value={s}>{translate(locale, statusKey(s))}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 font-medium">{translate(locale, "priorityFilter")}</label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0066ff]/30"
          >
            {["ALL", "URGENT", "HIGH", "MEDIUM", "LOW"].map((p) => (
              <option key={p} value={p}>{translate(locale, priorityKey(p))}</option>
            ))}
          </select>
        </div>
        <span className="ml-auto text-sm text-gray-400">{tasks.length} task{tasks.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400">
            <div className="w-6 h-6 border-2 border-[#0066ff] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <CheckSquare size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No tasks found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-800">{task.title}</p>
                    {task._count.subTasks > 0 && (
                      <span className="text-[11px] text-gray-400">({task._count.subTasks} subtask{task._count.subTasks !== 1 ? "s" : ""})</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{task.project.referenceNumber} · {task.project.title}</p>
                  {task.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{task.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {task.dueDate && (
                    <span className={`text-xs flex items-center gap-1 ${isOverdue(task.dueDate) && task.status !== "DONE" ? "text-red-500 font-medium" : "text-gray-400"}`}>
                      {isOverdue(task.dueDate) && task.status !== "DONE" && <AlertTriangle size={12} />}
                      <Calendar size={12} />
                      {formatDate(task.dueDate, locale)}
                    </span>
                  )}
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM}`}>
                    {translate(locale, priorityKey(task.priority))}
                  </span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status] || ""}`}>
                    {translate(locale, statusKey(task.status))}
                  </span>
                  {task.status !== "DONE" && task.status !== "CANCELLED" && (
                    <button
                      onClick={() => markDone(task.id)}
                      disabled={updatingId === task.id}
                      className="text-xs px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {updatingId === task.id ? "..." : translate(locale, "markDone")}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
