"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, Download, FileText, LoaderCircle } from "lucide-react";
import { translate } from "@/lib/i18n";
import { useCurrentLocale } from "@/components/LocaleProvider";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
};

type Project = {
  id: string;
  referenceNumber: string;
  title: string;
  description: string;
  scopeOfWork: string;
  status: string;
  targetDeliveryDate: string | null;
};

type ProjectFile = { id: string; originalName: string; category: string; sizeBytes: number };

export default function EmployeeProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const locale = useCurrentLocale();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [projectRes, tasksRes, filesRes] = await Promise.all([
          fetch(`/api/projects/${id}`),
          fetch(`/api/projects/${id}/tasks`),
          fetch(`/api/projects/${id}/files`),
        ]);
        if (!projectRes.ok) throw new Error(translate(locale, "noAccess"));
        const projectData = await projectRes.json();
        const taskData = tasksRes.ok ? await tasksRes.json() : { tasks: [] };
        const fileData = filesRes.ok ? await filesRes.json() : { files: [] };
        if (active) {
          setProject(projectData.project);
          setTasks(taskData.tasks || []);
          setFiles(fileData.files || []);
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load project.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [id, locale]);

  async function markDone(taskId: string) {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DONE" }),
    });
    if (response.ok) setTasks((current) => current.map((task) => task.id === taskId ? { ...task, status: "DONE" } : task));
  }

  if (loading) return <div className="p-8 text-sm text-slate-500 flex items-center gap-2"><LoaderCircle className="w-4 h-4 animate-spin" /> {translate(locale, "loading")}</div>;
  if (error || !project) return <div className="p-8"><p className="text-sm text-rose-700">{error || (locale === "ar" ? "المشروع غير موجود." : "Project not found.")}</p><Link className="text-sm text-blue-700 mt-4 inline-block" href="/employee/projects">{translate(locale, "backToProjects")}</Link></div>;

  return (
    <div className="max-w-5xl mx-auto p-5 sm:p-8 space-y-6">
      <Link href="/employee/projects" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-700"><ArrowLeft size={16} /> {translate(locale, "backToProjects")}</Link>
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs text-slate-400">{project.referenceNumber}</span>
          <span className="rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-semibold">{project.status.replaceAll("_", " ")}</span>
        </div>
        <h1 className="text-2xl font-bold text-[#0b2545]">{project.title}</h1>
        <p className="text-sm text-slate-600 leading-6">{project.description}</p>
        {project.scopeOfWork && <div className="border-t border-slate-100 pt-4"><h2 className="text-sm font-semibold text-slate-800 mb-2">{translate(locale, "workScope")}</h2><p className="text-sm text-slate-600 whitespace-pre-wrap leading-6">{project.scopeOfWork}</p></div>}
        {project.targetDeliveryDate && <p className="text-xs text-slate-500 flex items-center gap-2"><Clock3 size={14} /> {translate(locale, "targetDelivery")} {new Date(project.targetDeliveryDate).toLocaleDateString(locale === "ar" ? "ar-EG" : undefined)}</p>}
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div><h2 className="text-lg font-bold text-[#0b2545]">{translate(locale, "yourTasks")}</h2><p className="text-sm text-slate-500">{locale === "ar" ? "المهام المسندة إليك في هذا المشروع." : "Tasks assigned to you in this project."}</p></div>
        {tasks.length === 0 ? <p className="text-sm text-slate-400 py-4">{translate(locale, "noTasks")}</p> : <div className="divide-y divide-slate-100">{tasks.map((task) => <div key={task.id} className="py-4 flex items-start gap-3"><div className="pt-0.5">{task.status === "DONE" ? <CheckCircle2 className="text-emerald-600" size={18} /> : <Clock3 className="text-blue-600" size={18} />}</div><div className="flex-1 min-w-0"><h3 className="text-sm font-semibold text-slate-800">{task.title}</h3>{task.description && <p className="text-sm text-slate-500 mt-1">{task.description}</p>}<p className="text-xs text-slate-400 mt-2">{translate(locale, "status")}: {task.status.replaceAll("_", " ")} · {translate(locale, "priority")}: {task.priority}{task.dueDate ? ` · ${translate(locale, "due")} ${new Date(task.dueDate).toLocaleDateString(locale === "ar" ? "ar-EG" : undefined)}` : ""}</p></div>{task.status !== "DONE" && <button onClick={() => markDone(task.id)} className="text-xs font-semibold text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-lg">{translate(locale, "markDone")}</button>}</div>)}</div>}
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div><h2 className="text-lg font-bold text-[#0b2545]">{translate(locale, "projectFiles")}</h2><p className="text-sm text-slate-500">{translate(locale, "projectFilesHelp")}</p></div>
        {files.length === 0 ? <p className="text-sm text-slate-400 py-4">{translate(locale, "noFiles")}</p> : <div className="divide-y divide-slate-100">{files.map((file) => <a key={file.id} href={`/api/files/${file.id}`} className="py-3 flex items-center gap-3 text-sm text-slate-700 hover:text-blue-700"><FileText size={17} /><span className="flex-1 truncate">{file.originalName}</span><span className="text-xs text-slate-400">{Math.ceil(file.sizeBytes / 1024)} KB</span><Download size={15} /></a>)}</div>}
      </section>
    </div>
  );
}
