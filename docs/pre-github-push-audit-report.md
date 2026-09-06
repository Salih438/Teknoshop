# Teknoshop — Pre-GitHub-Push Comprehensive Security Audit Report

**Date:** September 5, 2026  
**Auditor:** Antigravity AI  
**Scope:** Pre-public-GitHub-push & live-Vercel-production safety review  
**Live Site:** https://teknoshop-salih14.vercel.app/  
**Repo Status:** Private — about to be made public for the first time  

---

> [!IMPORTANT]
> **TOP LINE:** No API keys, database credentials, Clerk secrets, or payment secrets were found anywhere in the current git history or tracked file set. **The repository is clear of credential leaks.** There is **no blocker** from a secret-exposure standpoint. See Section 1 for full evidence.

---

## Findings Priority Table

| # | Priority | Section | Finding | Impact | Action Required |
|---|---------|---------|---------|--------|----------------|
| 1 | **P1** | §2/§5 | **Production CSP missing `worker-src`** — live Vercel serves old CSP without the fix | Clerk workers blocked in production | Commit & deploy `next.config.ts` |
| 2 | **P1** | §2 | **`docs/verification-log.md` contains real personal emails** (`admin-test@example.com`, `customer-test@example.com`) — publicly visible if pushed | PII disclosure | **Redact before push** |
| 3 | **P2** | §3 | **Rate limiting falls to in-memory on Vercel** — `UPSTASH_REDIS_REST_URL/TOKEN` not in local `.env`; if not set in Vercel panel, rate limiting is per-invocation and useless | Rate limit bypass on multi-instance | Confirm Upstash env vars in Vercel dashboard |
| 4 | **P2** | §4 | **All monetary columns are `Float` (IEEE 754)** — rounding drift risk | Financial accuracy (demo context only) | Document; fix in future Decimal migration |
| 5 | **P2** | §5 | **Prisma migrate status could not run** — Neon DB offline from local; cannot confirm schema sync | DB drift could cause 500s | Verify via Vercel logs or live Prisma Studio |
| 6 | **P3** | §5 | **README documents `UPLOADTHING_SECRET` but code uses `UPLOADTHING_TOKEN`** | Confusing for cloners | Update README |
| 7 | **P3** | §5 | **`UPSTASH_REDIS_REST_*` and `RESEND_API_KEY` undocumented in README** | Cloners won't know to set them | Update README |
| 8 | **P3** | §2 | **94 audit PNG screenshots untracked** — would bloat public repo if added | Repo size | Add `docs/screenshots/` to `.gitignore` |
| 9 | **P3** | §2 | **`middleware.ts` deprecated filename** — build shows deprecation warning | Cosmetic build noise | Rename to `proxy.ts` |

---

## Section 1 — Secret & Credential Leak Scan CLEAN

### 1.1 Git History Scan (All 27 Commits)

| Pattern Searched | Result |
|-----------------|--------|
| `sk_live_`, `sk_test_`, `pk_live_`, `pk_test_`, `whsec_`, `rk_live_`, `resend_` | **0 matches** |
| `CLERK_SECRET_KEY=sk_` (actual key value) | **0 matches** |
| `postgresql://` (real connection strings) | Only matched `lib/env.ts` test placeholder: `postgresql://test:test@localhost:5432/test` — **not a real credential** |
| `neon.tech` | **0 matches** |
| `UPLOADTHING_SECRET=ut` | **0 matches** |
| `sk_live\|sk_test\|@ep-` (current tree `git grep`) | **0 matches** |

**Finding: No secrets in history or current tracked files.** PASS

### 1.2 .gitignore Coverage

```gitignore
# env files (can opt-in for committing if needed)
.env*
```

Correctly excludes `.env`, `.env.local`, `.env.production`, `.env.development`.

**`git ls-files | grep env` output:**
```
lib/env.ts
```
Only `lib/env.ts` (source code with Zod schema validation — no actual values). No `.env` file is tracked. PASS

### 1.3 Local .env Key Inventory (values redacted)

```
DATABASE_URL=[REDACTED — host: ep-delicate-hat-asph4gow-pooler.c-4.eu-central-1.aws.neon.tech]
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=[REDACTED]
CLERK_SECRET_KEY=[REDACTED]
UPLOADTHING_TOKEN=[REDACTED]
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_STORE_NAME="Teknoshop"
```

None committed. PASS

### 1.4 Hardcoded Values Assessment

| File | Hardcoded Value | Risk |
|------|----------------|------|
| `lib/env.ts:7` | `"postgresql://test:test@localhost:5432/test"` | SAFE — dummy fallback, `NODE_ENV=test` only |
| `lib/env.ts:19` | `"https://vitrin.com"` (default URL) | Cosmetic leftover from rebrand; not a secret |
| `lib/env.ts:12` | `"Teknoshop <onboarding@resend.dev>"` | Resend's public demo address; not secret |
| `prisma/seed.ts` | Category and brand names | SAFE — no credentials |

---

## Section 2 — Production Safety of Uncommitted Changes

### 2.1 Git Status Summary

```
Modified (tracked, would deploy with next push):
 M app/(storefront)/products/[id]/page.tsx    ← branding fix (metadata only)
 M app/(storefront)/search/page.tsx           ← branding fix (metadata only)
 M app/admin/orders/OrderStatusSelect.tsx     ← WCAG badge color (CSS only)
 M components/profile/ExchangeStatusCard.tsx  ← WCAG badge color (CSS only)
 M components/profile/ProfileTabContainer.tsx ← WCAG badge color (CSS only)
 M components/profile/ReturnStatusCard.tsx    ← WCAG badge color (CSS only)
 M components/providers/QueryProvider.tsx     ← BOM whitespace fix
 M docs/verification-log.md                  ← ⚠️ PII emails on line 137
 M next.config.ts                            ← CSP worker-src fix
 M package.json                              ← @prisma/client dev→prod
 M package-lock.json                         ← lockfile sync

Untracked (not staged, won't push without git add):
 ?? docs/screenshots/ (94 PNGs)
 ?? docs/ui-ux-audit-report.md
 ?? docs/ui-ux-audit-data.json
 ?? scripts/capture_ui_audit_screenshots.ts
 ?? scripts/check_csp.ts
 ?? scripts/test_*.ts  (10 more audit scripts)
```

### 2.2 Per-File Risk Assessment

| File | Auth/Payment/DB? | Break Risk | Assessment |
|------|-----------------|------------|------------|
| `products/[id]/page.tsx` | No — metadata | None | Safe |
| `search/page.tsx` | No — metadata | None | Safe |
| `OrderStatusSelect.tsx` | No — CSS only | None | Safe |
| `ExchangeStatusCard.tsx` | No — CSS only | None | Safe |
| `ProfileTabContainer.tsx` | No — CSS only | None | Safe |
| `ReturnStatusCard.tsx` | No — CSS only | None | Safe |
| `QueryProvider.tsx` | No — whitespace | None | Safe |
| `verification-log.md` | No — docs | None to site; **PII risk** | Redact first |
| `next.config.ts` | No — additive CSP | None (additive) | Safe, beneficial |
| `package.json` | Dep classification | None | Safe |
| `package-lock.json` | Lockfile | None | Safe |

### 2.3 Production Build Output

```
npm run build — EXIT CODE 0

▲ Next.js 16.2.10 (Turbopack)
✓ Compiled successfully in 6.2s
✓ TypeScript: 0 errors in 7.9s
✓ Generating static pages (41/41) in 1259ms
All API routes: compiled correctly

Routes: 41 dynamic (ƒ), 2 static (○)
```

Build succeeds cleanly. Vercel deployment would not break. PASS

> [!WARNING]
> Deprecation present in every build:
> `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.`
> Still works but should be addressed: rename `middleware.ts` → `proxy.ts`.

### 2.4 Vercel Auto-Deploy Assessment

Given the Vercel/GitHub integration likely on `main` branch, all uncommitted changes should be committed and pushed together in one commit to ensure the live site is updated atomically (including the CSP fix).

---

## Section 3 — Security Audit

### 3.1 IDOR Protection CONFIRMED IN CODE

| Resource | Protection Mechanism | Code Location |
|----------|---------------------|---------------|
| Order invoice | `order.userId !== dbUser.id && role !== "ADMIN"` → 403 | `app/api/orders/[id]/invoice/route.ts:57` |
| Address update | `AddressService.updateAddress(addressId, dbUser.id, ...)` | `app/api/addresses/[id]/route.ts:70` |
| Address delete | `AddressService.deleteAddress(addressId, dbUser.id)` | `app/api/addresses/[id]/route.ts:105` |
| Checkout address | `address.userId !== userId` → 403 | `lib/services/checkout.service.ts:31` |
| Order cancel | `order.userId !== options.userId` → throw UNAUTHORIZED | `lib/services/order.service.ts:33` |

All critical IDOR vectors are protected server-side. PASS (code-inspected)

### 3.2 Admin Route Protection CONFIRMED IN CODE

`lib/auth.ts` — `requireAdmin()` enforces:
1. Clerk session present → else 401
2. `role === "ADMIN"` in DB → else 403
3. `isActive === true` → else 403
4. Granular `hasPermission(systemRole, permission)` → else 403

Every `/api/admin/*` route begins with `await requireAdmin("PERMISSION")`. PASS

### 3.3 Rate Limiting — VERIFY REDIS IN PRODUCTION

The rate limiter has two paths:

**Path A — Distributed Redis (Upstash):** Effective across Vercel instances. Requires `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to be set.

**Path B — In-Memory Fallback:** Per-process memory bucket. On Vercel serverless, each invocation is a fresh process — **this fallback provides zero protection in production.**

Local `.env` does **not** contain Upstash credentials. **Action required:** confirm these are set in Vercel's Environment Variables dashboard.

Rate limits per endpoint:

| Endpoint | Limit | Window |
|---------|-------|--------|
| POST `/api/checkout` | 5 | 600s |
| GET `/api/orders/[id]/invoice` | 20 | 60s |
| POST/GET `/api/addresses` | 15 | 600s |
| DELETE `/api/addresses/[id]` | 10 | 600s |

### 3.4 Input Validation PASS

All mutation endpoints use `z.safeParse()` with strict schemas. Verified:
- All IDs: `z.string().uuid()` — malformed UUIDs rejected with 400
- Quantities: `z.number().int().positive()` — negative numbers and floats rejected
- Strings: bounded by `.min()` and `.max()` — oversized inputs rejected
- Unexpected fields: stripped by Zod (no schema pollution)

### 3.5 Payment Flow SAFE — FULLY SIMULATED

```typescript
// lib/services/payment-gateway.service.ts
export class SimulatedPaymentGatewayAdapter {
  async processPayment(params): Promise<PaymentProcessingResult> {
    return { isSimulated: true, transactionId: "SIM_TX_...", status: "COMPLETED" };
  }
}
```

No live payment gateway. No Stripe/Iyzico keys. No real card processing. No payment webhook endpoints. No payment redirect ownership vulnerability — result returned directly in POST body. PASS (simulated by design)

### 3.6 Live Production Security Headers

**Confirmed via HTTP GET to `https://teknoshop-salih14.vercel.app/`:**

| Header | Live Production Value | Status |
|--------|----------------------|--------|
| `Content-Security-Policy` | Present (old — missing `worker-src`) | ⚠️ Needs deploy |
| `X-Frame-Options` | `SAMEORIGIN` | PASS |
| `X-Content-Type-Options` | `nosniff` | PASS |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | PASS |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | PASS |
| `Permissions-Policy` | `camera=(), microphone=(self), geolocation=()` | PASS |
| `X-Robots-Tag` | `noindex` | INFO (intentional for demo) |

**Live CSP (production, pre-fix deploy):**
```
default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' 
https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com; 
style-src ...; font-src ...; img-src ...; connect-src ...; frame-src ...;
object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'
```
Missing: `worker-src 'self' blob:` — will be fixed once `next.config.ts` is deployed.

---

## Section 4 — Business Logic Correctness

### 4.1 Pricing Integrity — P2 KNOWN LIMITATION

Schema uses `Float` for all monetary fields. Floating-point arithmetic cannot represent all decimal fractions exactly. The code partially compensates:
- `Math.round(... * 100) / 100` for order total
- `Number((value * 0.20).toFixed(2))` for invoice KDV

**Assessment:** Acceptable for a demo project with simulated payments. For real production with live payments, migrate all monetary columns to `Decimal` or store as integer cents.

### 4.2 Inventory Race Condition PROTECTED

```typescript
// Atomic conditional update — no overselling possible:
const variantResult = await tx.productVariant.updateMany({
  where: { id: item.variantId, stock: { gte: item.quantity } },  // guard
  data: { stock: { decrement: item.quantity } },
});
if (variantResult.count === 0) throw new CheckoutError("Stok tükendi", 409);
```

Same pattern for simple products. Both inside `prisma.$transaction`. PASS

### 4.3 Order Status State Machine ENFORCED

```typescript
ALLOWED_STATUS_TRANSITIONS = {
  PENDING:    ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED",    "CANCELLED"],
  SHIPPED:    ["DELIVERED"],
  DELIVERED:  [],   // terminal
  CANCELLED:  [],   // terminal
}
```

`DELIVERED → PENDING` ❌ blocked. `CANCELLED → anything` ❌ blocked.
Admin API enforces this via `isStatusTransitionAllowed()` before any DB write. PASS

### 4.4 Coupon Atomicity PASS

Usage limit enforced atomically:
```typescript
const result = await tx.coupon.updateMany({
  where: { id: dbCoupon.id, usedCount: { lt: dbCoupon.usageLimit } },
  data: { usedCount: { increment: 1 } },
});
if (result.count === 0) throw new CheckoutError("Kullanım limiti dolmuş", 400);
```
All within the checkout transaction. Discount applied to actual `totalPrice`. PASS

### 4.5 Cancellation/Refund Logic PASS

`OrderService.cancelOrder()` is a single `prisma.$transaction`:
1. Atomic status guard (`status: { not: CANCELLED }`)
2. Stock restoration (variant + simple products)
3. `salesCount` decrement
4. `coupon.usedCount` decrement (guard: `gt: 0`)
5. `CouponUsage` deletion
6. `payment.status` → `REFUNDED` (if COMPLETED) or `FAILED` (if PENDING)
7. Idempotency: returns early if already cancelled

PASS

---

## Section 5 — Database & Environment Parity

### 5.1 Schema Drift

`npx prisma migrate status` returned:
```
P1001: Can't reach database server at ep-delicate-hat-asph4gow-pooler...neon.tech:5432
```

Cannot confirm from local. Verify via:
- Vercel deployment logs (any P3 Prisma errors = schema drift)
- Prisma Studio connected to live Neon DB
- `npx prisma db pull` from a network with Neon access

### 5.2 Environment Variable Parity

| Variable | README | Local .env | lib/env.ts | Notes |
|----------|--------|-----------|-----------|-------|
| `DATABASE_URL` | ✅ | ✅ | ✅ required | |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | ✅ | ✅ optional | |
| `CLERK_SECRET_KEY` | ✅ | ✅ | ✅ optional | |
| `UPLOADTHING_TOKEN` | ❌ (listed as `UPLOADTHING_SECRET`) | ✅ | ✅ optional | Name mismatch in README |
| `UPLOADTHING_APP_ID` | ✅ in README | ❌ not present | ❌ not in schema | Appears obsolete |
| `NEXT_PUBLIC_APP_URL` | ✅ | ✅ (localhost) | ✅ | Must be prod URL in Vercel |
| `UPSTASH_REDIS_REST_URL` | ❌ | ❌ | ✅ optional | Undocumented but needed for rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | ❌ | ❌ | ✅ optional | Undocumented but needed for rate limiting |
| `RESEND_API_KEY` | ❌ | ❌ | ✅ optional | Undocumented; needed for email |

---

## Go / No-Go Recommendation

### ONE BLOCKER — Must Resolve Before Push

> [!CAUTION]
> **Redact PII from `docs/verification-log.md` line 137.**  
> The file currently contains: `customer-test@example.com` and `admin-test@example.com`  
> Replace with anonymized labels (e.g., `customer-test@example.com`, `admin-test@example.com`) before committing.

### Safe to Push After Blocker is Resolved

Commit all modified tracked files together:

```bash
# 1. Redact PII from verification-log.md first
# 2. Then:
git add next.config.ts package.json package-lock.json
git add components/profile/ app/admin/ "app/(storefront)/"
git add components/providers/QueryProvider.tsx
git add docs/verification-log.md
git commit -m "fix: CSP worker-src, WCAG badge contrast, branding metadata"
git push origin main
```

**Add to `.gitignore` before `git add -A`:**
```
docs/screenshots/
docs/ui-ux-audit-data.json
docs/wcag-contrast-data.json
scripts/test_*.ts
scripts/capture_*.ts
scripts/check_*.ts
scripts/diagnose_*.ts
scripts/verify_*.ts
scripts/recalculate_*.ts
scripts/summarize_*.ts
scripts/get_sample_data.ts
```

### Fast-Follow After Push (Not Blockers)

| Priority | Action |
|---------|--------|
| P1 | Confirm `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in Vercel env panel |
| P1 | Verify Prisma schema sync with live Neon DB |
| P2 | Fix README: rename `UPLOADTHING_SECRET` → `UPLOADTHING_TOKEN`, add Upstash + Resend vars |
| P3 | Rename `middleware.ts` → `proxy.ts` to clear Next.js 16 deprecation warning |
| P3 | Evaluate Float → Decimal migration for monetary columns |

---

## Quality Gate Summary

```
npx tsc --noEmit          → EXIT 0 — 0 TypeScript errors  ✅
npm test                  → EXIT 0 — 4 files / 20 tests PASS  ✅
npx eslint app components lib → EXIT 0 — 0 errors  ✅
npm run build             → EXIT 0 — 41 routes compiled  ✅
git history secret scan   → 0 secrets found in 27 commits  ✅
Live production headers   → All 6 security headers confirmed  ✅
```

---

*Audit executed September 5, 2026. Command outputs are real. Live header check performed via HTTP request to `https://teknoshop-salih14.vercel.app/`. Git history scanned with pickaxe `-S` and `--pickaxe-regex` across all 27 commits.*
