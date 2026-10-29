import type { Prisma } from "@prisma/client";
import type { Role, SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export function isOperationsRole(role: Role): boolean {
  return role === "SUPER_ADMIN" || role === "OPERATIONS_MANAGER";
}

export function canManageCustomerOperations(role: Role): boolean {
  return isOperationsRole(role) || role === "SUPPORT_AGENT";
}

/** Scope staff project lists to the projects they need for their role. */
export function projectVisibilityWhere(user: SessionUser): Prisma.ProjectWhereInput {
  if (isOperationsRole(user.role) || user.role === "SUPPORT_AGENT") return {};
  if (user.role === "CLIENT") return { clientId: user.id };

  if (user.role === "PROJECT_LEAD") {
    return {
      OR: [
        { leadStaffId: user.id },
        { members: { some: { userId: user.id } } },
        ...(user.departmentId && user.isDepartmentLead
          ? [
              { departmentId: user.departmentId },
              { workflowStages: { some: { assignedDepartmentId: user.departmentId } } },
            ]
          : []),
      ],
    };
  }

  return {
    OR: [
      { members: { some: { userId: user.id } } },
      { tasks: { some: { assigneeId: user.id } } },
      { leadStaffId: user.id },
    ],
  };
}

export async function canAccessProject(user: SessionUser, projectId: string): Promise<boolean> {
  return Boolean(
    await prisma.project.findFirst({
      where: { id: projectId, ...projectVisibilityWhere(user) },
      select: { id: true },
    }),
  );
}

export async function canManageProject(user: SessionUser, projectId: string): Promise<boolean> {
  if (isOperationsRole(user.role)) return true;
  if (user.role !== "PROJECT_LEAD") return false;

  return Boolean(
    await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { leadStaffId: user.id },
          { members: { some: { userId: user.id, role: "LEAD" } } },
          ...(user.departmentId && user.isDepartmentLead
            ? [
                { departmentId: user.departmentId },
                { workflowStages: { some: { assignedDepartmentId: user.departmentId } } },
              ]
            : []),
        ],
      },
      select: { id: true },
    }),
  );
}

/** Internal project coordination is reserved for operations and project leads. */
export async function canReadInternalProjectDiscussion(
  user: SessionUser,
  projectId: string,
): Promise<boolean> {
  if (isOperationsRole(user.role)) return true;
  if (user.role !== "PROJECT_LEAD") return false;
  return canAccessProject(user, projectId);
}
