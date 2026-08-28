import { describe, it, expect } from "vitest";
import { hasPermission, ALL_PERMISSIONS, SystemRole } from "@/lib/rbac";

describe("RBAC (Role-Based Access Control) Engine", () => {
  it("SUPER_ADMIN should have all permissions", () => {
    for (const perm of ALL_PERMISSIONS) {
      expect(hasPermission("SUPER_ADMIN", perm)).toBe(true);
    }
  });

  it("ADMIN should have operational permissions but cannot MANAGE_ROLES or DELETE_USERS", () => {
    expect(hasPermission("ADMIN", "MANAGE_PRODUCTS")).toBe(true);
    expect(hasPermission("ADMIN", "MANAGE_ORDERS")).toBe(true);
    expect(hasPermission("ADMIN", "MANAGE_USERS")).toBe(true);
    expect(hasPermission("ADMIN", "MANAGE_ROLES")).toBe(false);
    expect(hasPermission("ADMIN", "DELETE_USERS")).toBe(false);
  });

  it("CUSTOMER_SUPPORT should have order, return, and exchange permissions", () => {
    expect(hasPermission("CUSTOMER_SUPPORT", "MANAGE_ORDERS")).toBe(true);
    expect(hasPermission("CUSTOMER_SUPPORT", "MANAGE_RETURNS")).toBe(true);
    expect(hasPermission("CUSTOMER_SUPPORT", "MANAGE_EXCHANGES")).toBe(true);
    expect(hasPermission("CUSTOMER_SUPPORT", "MANAGE_PRODUCTS")).toBe(false);
    expect(hasPermission("CUSTOMER_SUPPORT", "MANAGE_ROLES")).toBe(false);
  });

  it("CONTENT_MANAGER should only manage catalog (products, categories, brands)", () => {
    expect(hasPermission("CONTENT_MANAGER", "MANAGE_PRODUCTS")).toBe(true);
    expect(hasPermission("CONTENT_MANAGER", "MANAGE_CATEGORIES")).toBe(true);
    expect(hasPermission("CONTENT_MANAGER", "MANAGE_BRANDS")).toBe(true);
    expect(hasPermission("CONTENT_MANAGER", "MANAGE_ORDERS")).toBe(false);
    expect(hasPermission("CONTENT_MANAGER", "DELETE_PRODUCTS")).toBe(false);
  });

  it("ANALYST should only have read-only analytics permissions", () => {
    expect(hasPermission("ANALYST", "VIEW_DASHBOARD")).toBe(true);
    expect(hasPermission("ANALYST", "VIEW_ANALYTICS")).toBe(true);
    expect(hasPermission("ANALYST", "MANAGE_PRODUCTS")).toBe(false);
    expect(hasPermission("ANALYST", "MANAGE_ORDERS")).toBe(false);
  });

  it("Undefined or non-staff roles should have no permissions", () => {
    expect(hasPermission(undefined, "VIEW_DASHBOARD")).toBe(false);
    expect(hasPermission("ANALYST" as SystemRole, "MANAGE_ROLES")).toBe(false);
  });

  it("should return false for invalid or unknown roles", () => {
    expect(hasPermission("UNKNOWN_ROLE" as unknown as SystemRole, "MANAGE_PRODUCTS")).toBe(false);
    expect(hasPermission(undefined as unknown as SystemRole, "MANAGE_PRODUCTS")).toBe(false);
  });
});
