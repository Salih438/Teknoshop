import { prisma } from "@/lib/prisma";
import { AuditRiskLevel, AuditLog } from "@prisma/client";
import { getDbUser } from "@/lib/auth-utils";

export interface CreateAuditLogParams {
  adminId?: string | null;
  adminName?: string | null;
  adminEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  entityName?: string | null;
  riskLevel?: AuditRiskLevel;
  oldValue?: Record<string, any> | null;
  newValue?: Record<string, any> | null;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditLogService {
  /**
   * 🛡️ Sistem genelinde kritik admin işlemlerini veritabanına kaydeder.
   * Opsiyonel `tx` parametresi girilirse Prisma Transaction içinde çalışarak atomiklik sağlar.
   */
  static async createAuditLog(params: CreateAuditLogParams, tx?: any): Promise<AuditLog | null> {
    try {
      const dbUser = params.adminId ? null : await getDbUser();

      const {
        adminId = dbUser?.id || "system_admin",
        adminName = dbUser?.name || "Yönetici (Admin)",
        adminEmail = dbUser?.email || "admin@eticaret.com",
        action,
        entityType,
        entityId = null,
        entityName = null,
        riskLevel = AuditRiskLevel.LOW,
        oldValue = null,
        newValue = null,
        ipAddress = "127.0.0.1",
        userAgent = "Next.js Admin Console",
      } = params;

      const client = tx || prisma;

      const newLog = await client.auditLog.create({
        data: {
          adminId: adminId || dbUser?.id || "system_admin",
          adminName: adminName || dbUser?.name || "Yönetici (Admin)",
          adminEmail: adminEmail || dbUser?.email || "admin@eticaret.com",
          action,
          entityType,
          entityId,
          entityName,
          riskLevel,
          oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : undefined,
          newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : undefined,
          ipAddress,
          userAgent,
        },
      });

      return newLog;
    } catch (error) {
      console.error("[AuditLogService.createAuditLog Error]:", error);
      if (tx) {
        throw error;
      }
      return null;
    }
  }
}
