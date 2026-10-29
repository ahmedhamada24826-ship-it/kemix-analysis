import { prisma } from "./prisma";

export type NotificationType =
  | "REQUEST"
  | "MESSAGE"
  | "PROPOSAL"
  | "PROJECT"
  | "SUPPORT"
  | "GENERAL";

export interface SendNotificationParams {
  userId: string;
  title: string;
  message: string;
  link?: string;
  type?: NotificationType;
}

export async function sendNotification({
  userId,
  title,
  message,
  link,
  type = "GENERAL",
}: SendNotificationParams) {
  try {
    // 1. Persist notification in database
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        link,
        type,
      },
    });

    return notification;
  } catch (err) {
    console.error("Failed to send notification:", err);
    return null;
  }
}

export async function logAudit({
  actorId,
  action,
  entityType,
  entityId,
  details,
  ipAddress,
}: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown> | string;
  ipAddress?: string;
}) {
  try {
    const detailsString =
      typeof details === "string" ? details : details ? JSON.stringify(details) : null;

    await prisma.auditLog.create({
      data: {
        actorId: actorId || null,
        action,
        entityType,
        entityId: entityId || null,
        details: detailsString,
        ipAddress: ipAddress || null,
      },
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}
