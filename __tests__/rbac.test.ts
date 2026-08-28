import { describe, it, expect } from "vitest";
import { hasPermission, ALL_PERMISSIONS, Permission, SystemRole } from "@/lib/rbac";

describe("RBAC (Role-Based Access Control) Engine", () => {
  it("SUPER_ADMIN should have all permissions", () => {
    for (const perm of ALL_PERMISSIONS) {
      expect(hasPermission("SUPER_ADMIN", perm)).toBe(true);
    }
  });

  it("ADMIN should have almost all permissions except MANAGE_ROLES and DELETE_USERS", () => {
    expect(hasPermission("ADMIN", "MANAGE_PRODUCTS")).toBe(true);
    expect(hasPermission("ADMIN", "MANAGE_ORDERS")).toBe(true);
    expect(hasPermission("ADMIN", "MANAGE_ROLES")).toBe(false);
    expect(hasPermission("ADMIN", "DELETE_USERS")).toBe(false);
  });

  it("CUSTOMER_SUPPORT should have order, return, and exchange permissions", () => {
    expect(hasPermission("CUSTOMER_SUPPORT", "MANAGE_ORDERS")).toBe(true);
    expect(hasPermission("CUSTOMER_SUPPORT", "MANAGE_RETURNS")).toBe(true);
    expect(hasPermission("CUSTOMER_SUPPORT", "MANAGE_EXCHANGES")).toBe(true);
    expect(hasPermission("CUSTOMER_SUPPORT", "MANAGE_ROLES")).toBe(false);
    expect(hasPermission("CUSTOMER_SUPPORT", "MANAGE_SETTINGS")).toBe(false);
  });

  it("CONTENT_MANAGER should only have catalog permissions", () => {
    expect(hasPermission("CONTENT_MANAGER", "MANAGE_PRODUCTS")).toBe(true);
    expect(hasPermission("CONTENT_MANAGER", "MANAGE_CATEGORIES")).toBe(true);
    expect(hasPermission("CONTENT_MANAGER", "MANAGE_ORDERS")).toBe(false);
    expect(hasPermission("CONTENT_MANAGER", "MANAGE_ROLES")).toBe(false);
  });

  it("ANALYST should only have dashboard and analytics view permissions", () => {
    expect(hasPermission("ANALYST", "VIEW_ANALYTICS")).toBe(true);
    expect(hasPermission("ANALYST", "VIEW_DASHBOARD")).toBe(true);
    expect(hasPermission("ANALYST", "MANAGE_PRODUCTS")).toBe(false);
    expect(hasPermission("ANALYST", "MANAGE_ROLES")).toBe(false);
    expect(hasPermission("ANALYST", "MANAGE_ORDERS")).toBe(false);
  });

  it("should return false for invalid or unknown roles", () => {
    expect(hasPermission("UNKNOWN_ROLE" as unknown as SystemRole, "MANAGE_PRODUCTS")).toBe(false);
    expect(hasPermission(undefined as unknown as SystemRole, "MANAGE_PRODUCTS")).toBe(false);
  });
});
