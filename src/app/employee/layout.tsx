import { redirect } from "next/navigation";
import { getSession, isStaffRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EmployeeSidebar from "@/components/EmployeeSidebar";

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/auth/login");
  if (session.role === "CLIENT") redirect("/client");
  if (!isStaffRole(session.role)) redirect("/auth/login");

  const unreadCount = await prisma.notification.count({
    where: { userId: session.id, isRead: false },
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <EmployeeSidebar session={session} unreadCount={unreadCount} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
