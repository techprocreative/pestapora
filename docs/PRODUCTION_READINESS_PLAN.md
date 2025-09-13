# PESTAPORA – Production Readiness Plan (Ticket Purchase → Entry Gate)

This document outlines how to take this Vite + React TypeScript app to a production‑ready ticketing platform, covering the end‑to‑end flow from browsing events and purchasing tickets, through payment, ticket issuance (QR), and validation at entry gates (online/offline), plus operational and security considerations.

## 1) Goals & Scope
- Reliability: Atomic inventory, no oversell, idempotent payments, robust scanning.
- Security: Strong auth, RBAC, RLS, signed QR, least privilege, auditability.
- Scale: Handle spikes during on‑sale and burst traffic at gates.
- Operability: Observability, incident playbooks, rollbacks.
- UX: Smooth purchase, clear order confirmation, offline‑capable gate scanning.

Non‑goals (initially): Complex secondary market, dynamic pricing, multi‑tenant organizers. These can be phased later.

## 2) Current State Summary (as of repo)
- Frontend: Vite + React 18 + Tailwind + Zustand store.
- Mock data: `src/data/mockEvents.ts`; state persisted locally via Zustand `persist`.
- Auth: Mock (`admin@pestapora.com` / `pestapora123`), no real backend.
- Checkout: Simulated `processPayment` creates an in‑memory `Order` with a non‑secure `qrCode` string; no persistence.
- Routing: No route for order confirmation (`/order-confirmation/:id` is navigated to but not defined).
- Packages present but unused: `@supabase/supabase-js`, `qrcode`.

Key gaps to production:
- No backend/database; no real authentication or authorization.
- No inventory control or seat hold; risk of overselling.
- No payment gateway; no webhook handling or idempotency.
- No real tickets; no secure QR; no email/PDF delivery.
- No gate scanning application or API; no online/offline validation flow.
- No operational hardening (logging, metrics, alerting, backups, rate limiting, WAF, etc.).

## 3) Proposed Architecture

Use a pragmatic, cloud‑friendly stack that aligns with dependencies already in the repo.

- Frontend (this app)
  - React + Vite; add React Query for server state; integrate real auth and backend APIs.
  - Add routes: Order Confirmation, My Tickets, Ticket Detail (with QR), Organizer Dashboard (basic), Gate Scanner (PWA) for staff.
- Backend & Data
  - Supabase (Postgres + Auth + Storage + RLS + Realtime) OR Node (Fastify/Nest) + Postgres. Given `@supabase/supabase-js` is already present, Supabase is recommended to accelerate.
  - Edge Functions (serverless) for payment intents, webhooks, QR issuance, and scan endpoints.
- Payments
  - Indonesia: Midtrans or Xendit. Alternative: Stripe (if regionally acceptable).
  - Server‑side intents, signature verification, idempotency keys, and webhooks update orders/tickets.
- Ticket Assets
  - Generate QR (PNG/SVG) via `qrcode`, store in Supabase Storage with signed URLs.
  - Optional: PDF ticket via serverless (e.g., `pdfkit`), or HTML template → PDF service.
- Entry Gate System
  - Web PWA scanner (`@zxing/library`), worker‑driven scanning.
  - Online validation API first; add offline fallback with signed tokens + periodic sync.
- Observability
  - Structured logging, Sentry for FE/BE, metrics (Prometheus/OpenTelemetry), dashboards + alerts.

Deployment Targets
- Frontend: Vercel/Netlify (static + edge functions proxy if needed).
- Supabase: Managed Postgres + Edge Functions + Auth + Storage.
- Custom Node (if chosen): Fly.io/Render/Railway with managed Postgres.

## 4) Domain Model & Schema (Core)

Tables (Postgres):
- users (managed by Supabase Auth): id (uuid), email, name, role (enum: customer|staff|organizer|admin), created_at.
- organizers: id, name, slug, owner_user_id.
- events: id, organizer_id, title, description, starts_at, ends_at, venue, address, status, image_url, capacity, is_featured, tags (text[]), created_at.
- ticket_types: id, event_id, name, description, price_cents, currency, max_per_order, initial_inventory, remaining_inventory, color.
- seats (optional phase): id, event_id, section, row, number, status, price_cents (when reserved seating).
- orders: id, user_id, event_id, status (created|pending_payment|paid|cancelled|expired|refunded), subtotal_cents, fees_cents, total_cents, currency, created_at, expires_at.
- order_items: id, order_id, ticket_type_id, quantity, unit_price_cents.
- payments: id, order_id, provider, provider_intent_id, status, amount_cents, currency, captured_at, raw (jsonb), idempotency_key.
- tickets: id, order_id, event_id, ticket_type_id, user_id, status (issued|active|used|void), code (unique), qr_payload, issued_at, used_at, used_gate_id.
- gate_devices: id, event_id, name, location, public_key (for offline verify), status, last_seen_at.
- gate_scans: id, event_id, ticket_id, code, device_id, result (ok|duplicate|invalid|void), scanned_at, latency_ms, offline (bool), meta jsonb.
- reservations (holds): id, user_id, event_id, ticket_type_id, quantity, expires_at, status (active|released|converted), order_id nullable.

Indexes & Constraints
- Unique: tickets.code, (order_id, ticket_type_id) with quantities respected via items table.
- Inventory: trigger/constraint to enforce `remaining_inventory >= 0` and atomic decrement.
- Scans: unique partial index `(ticket_id) WHERE result='ok'` enforced via transactional validation to prevent double use.

Row Level Security (RLS)
- users can see their own orders/tickets.
- staff can validate scans for their assigned event(s).
- organizers can manage their own events/tickets; not others.

## 5) Auth & RBAC
- Use Supabase Auth (email/password, OAuth optional). Migrate mock auth to real auth.
- Roles via JWT claims or join table (user_roles) synchronized on login.
- Protect organizer/staff routes with role checks; use RLS policies server‑side.
- Add 2FA for staff accounts accessing gate tools.

## 6) Inventory & Cart Holds
- On adding to cart, create a short‑lived reservation record with TTL (e.g., 10 minutes) using DB transaction; decrement `remaining_inventory` on convert to order paid.
- For reserved seating: lock seats via `(event_id, seat_id)` unique constraint until expiration.
- Clean‑up job to release expired holds.

## 7) Payments
- Create order (status=created) with totals server‑side; return payment intent/session from provider.
- Client redirects to payment page (or collects card with provider SDK, not your server).
- Webhook endpoint (Edge Function):
  - Verify signature; look up order by provider id; idempotently update status to paid; generate tickets; send emails.
  - Handle async events: pending, settlement, failure, refund.
- Always idempotent: Use `idempotency_key` and unique constraints; retries safe.
- Never store raw card data; store only provider references and last4/brand if needed.

## 8) Ticket Issuance & QR
- On payment success, generate 1 ticket per unit in `order_items`.
- Ticket code: random, unguessable (e.g., 128‑bit) encoded base32 without ambiguous characters.
- QR payload options:
  - Online‑first: `{ticket_id, code}` minimal payload; server validates and marks used.
  - Offline‑capable: Signed token (JWT/compact) with claims: `ticket_id`, `event_id`, `exp` (short), and signature using organizer private key; gate devices hold public key. On reconnect, reconcile with server to ensure single‑use.
- Store QR as PNG/SVG via `qrcode` lib; upload to Supabase Storage; attach signed URL to ticket.
- Optional: Generate PDF ticket with QR and event details for email attachment.

## 9) Entry Gate System

Gate App (PWA)
- Built inside this repo under a protected route (e.g., `/gate`) or a separate bundle. Use `@zxing/library` for camera scanning.
- Staff login required; device registered to specific event/gate.
- Online flow:
  1) Scan → POST `/v1/scan` with `{ticket_id, code, device_id}`.
  2) Backend transaction: verify ticket active, event match, not used; mark used, insert `gate_scans` with result='ok'. If already used, return `duplicate` with prior `used_at` and `used_gate_id`.
  3) Return response with status; client renders big pass/fail screen + brief details. Play sound/haptic.
- Offline flow (Phase 2/3):
  - Pre‑sync: device downloads a compact Bloom filter or hash set of valid ticket codes for its event (or receives a public key for signature verification if using signed tokens).
  - Local verify: accept if signature valid and not locally marked used; mark local store as used with timestamp.
  - Reconcile: periodically push `gate_scans` to server; server resolves conflicts (first scan wins; later are duplicates). UI surfaces duplicates to staff.
- Anti‑double‑scan:
  - Debounce same code within N seconds on device.
  - Atomic server transaction for `used_at` write; unique partial index ensures single OK.
  - Realtime channel to broadcast “ticket used” so neighboring devices get instant invalidate.

Device Management
- Register devices (gate_devices) with friendly name/location; issue per‑device API key/JWT.
- Ability to revoke devices and track last_seen.

## 10) Emails & Notifications
- On payment success: send email with receipt + ticket links/attachments. Use provider like Resend/Mailgun.
- Reminders before event; post‑event follow‑ups.
- Attach `.ics` calendar invite. Consider Apple/Google Wallet passes later.

## 11) Frontend Changes (Roadmap)
- State: Introduce React Query; move business logic from Zustand to backend APIs.
- Auth: Replace mock with Supabase Auth; guard routes; show user profile.
- Flows:
  - Events list/detail: fetch from API.
  - Cart/Checkout: call API to create order and payment intent; handle redirects.
  - Order Confirmation: add route `/order-confirmation/:id` to show tickets/QRs.
  - My Tickets: list user tickets; Ticket Detail shows QR, one‑tap add to Wallet.
  - Organizer Dashboard: basic event/ticket type CRUD; stats; export.
  - Gate Scanner: protected route; camera scanner; big visual/audible feedback.
- UI Polishing:
  - Currency consistency (IDR) and formatting.
  - Fix minor text/encoding glitches (e.g., “CONTINUE SHOPPING” link char).
  - Accessibility: aria labels, focus states, landmarks.

## 12) API Surface (illustrative)
- POST `/v1/orders` → body: `{event_id, items:[{ticket_type_id, qty}]}` → returns `{order_id, client_secret|payment_url}`
- GET `/v1/orders/:id` → order status/details
- POST `/v1/payments/webhook` → provider callbacks (verify signature) → updates order/tickets
- GET `/v1/tickets` (auth: user) → list
- GET `/v1/tickets/:id` → ticket details + signed QR URL
- POST `/v1/scan` (auth: staff) → `{ticket_id, code, device_id}` → `{result, ticket, used_at, used_gate_id}`
- POST `/v1/scans/bulk` (staff) → offline reconciliation payload
- POST `/v1/gates/register` (staff) → register device; returns JWT

## 13) Security & Compliance
- Secrets: never in client; use server env / Supabase config. Vite only exposes `VITE_*` public vars.
- RLS: enforce user‑scoped reads; organizer/event scoping; staff gating.
- Rate limiting & WAF: throttle order create, scan endpoints; bot protection during on‑sale.
- Data minimization: do not put PII in QR payload; only IDs/signature.
- Audit: log all critical transitions (order status changes, scans, refunds) with actor and reason.
- Backups & DR: daily DB backups; runbooks for restore; webhook replay handling.
- Legal: Terms, refund policy, privacy policy; PCI scope minimized by using hosted payment pages.

## 14) Observability & SRE
- Logs: structured JSON; correlate request IDs across FE/BE.
- Errors: Sentry for FE & BE with source maps.
- Metrics: latency, error rate, order funnel, scan TPS, duplicate rate, inventory remaining.
- Dashboards & Alerts: paging for webhook failures, payment errors, scan spikes, inventory drift.

## 15) CI/CD & Quality
- CI: typecheck, lint, unit tests, build, preview deploys; block on high‑severity.
- Tests:
  - FE: unit (components), integration (routes), e2e (Playwright) for full purchase.
  - BE: unit (domain), integration (DB tx), contract tests for webhooks.
- Environments: dev, staging, prod; seeded demo data in non‑prod.

## 16) Phased Delivery Plan
Phase 0 – Stabilize UI
- Add missing routes (Order Confirmation), currency consistency, fix small glitches.

Phase 1 – Auth + Data
- Set up Supabase project; create schema & RLS; migrate FE to real auth.

Phase 2 – Orders & Payments
- Implement order creation, holds, payment intent, webhooks, ticket issuance, email delivery.

Phase 3 – Tickets UX
- My Tickets page, Ticket Detail with QR and PDF download; organizer dashboard basics.

Phase 4 – Gate Scanning (Online)
- Staff login, device registration, live scan API with atomic consume, realtime duplicate broadcast.

Phase 5 – Gate Scanning (Offline + Hardening)
- Signed QR tokens + offline verification, sync/reconciliation, advanced analytics, SLOs.

## 17) Noted Issues in Current Repo (quick wins)
- Missing route: `/order-confirmation/:id` referenced from checkout but not defined in `src/App.tsx`.
- Mock `processPayment` does not persist or generate secure QR; replace with API.
- Currency formatting is inconsistent (uses `$` in `CartPage` but IDR elsewhere).
- Minor encoding glitch in `CartPage` (“CONTINUE SHOPPING” link text).
- Installed but unused dependencies: `@supabase/supabase-js`, `qrcode`.

## 18) Example SQL (excerpt)

```sql
-- tickets table
create table tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  ticket_type_id uuid not null references ticket_types(id),
  user_id uuid not null references auth.users(id),
  status text not null check (status in ('issued','active','used','void')) default 'active',
  code text not null unique,
  qr_payload text not null,
  issued_at timestamptz not null default now(),
  used_at timestamptz null,
  used_gate_id uuid null references gate_devices(id)
);

-- atomic scan consume (conceptual)
-- in a function/transaction: verify active, then set used_at if null, else return duplicate
```

## 19) Frontend Work Items (backlog extract)
- Introduce React Query; API client; env management (`.env`, `.env.example`).
- Auth screens → Supabase Auth; remove mock; session handling & profile.
- Add routes: Order Confirmation, My Tickets, Ticket Detail, Gate Scanner.
- Replace `useStore.processPayment` with API calls; handle payment redirects/webhooks.
- Build ticket views with QR generation (from server) and download links.
- Staff/Gate: scanner UI with clear pass/fail feedback; device registration.
- Error boundaries, loading states; accessibility; SEO tags.

## 20) Success Metrics
- Purchase conversion rate; payment failure rate < 1%.
- On‑sale peak traffic handled without oversell.
- Gate scanning latency p95 < 400ms online; offline acceptance rate > 99%.
- Duplicate/invalid scan detection rate; incident MTTR.

---

This plan aligns with the current codebase while introducing the backend, payments, secure ticketing, and gate operations required for real‑world use. Happy to tailor details (provider choices, infra) to your constraints.

## 21) Maximum Security & Scale Addendum

This section tightens the plan for very large‑scale events, focusing on stronger trust boundaries, key management, anti‑abuse during on‑sale, device trust at gates, high availability, and supply‑chain integrity.

### 21.1 Threat Model & Trust Boundaries
- Adversaries: bot swarms (scalpers), DDoS, credential stuffing, payment fraud, insider abuse, lost/stolen gate devices, malicious Wi‑Fi at venue, supply‑chain compromise.
- Trust zones: client browsers (untrusted), gate devices (semi‑trusted), API/edge functions (trusted), DB (trusted), payment provider (trusted external), email provider (trusted external).
- Strategy: minimize privileges across zones; prefer hosted payments (SAQ A), signed artifacts, strict RLS, short‑lived credentials, and verifiable logs.

### 21.2 Key Management & Ticket Signing
- Keys: Ed25519 for QR token signing (fast, small), stored and used in cloud KMS (GCP/AWS/Azure). Do not export private keys.
- Rotation: rotate signing keys per event or monthly; embed `kid` in token header; maintain JWKS (public keys) for verifiers.
- Token format: compact JWS (JWT) with minimal claims: `{ tid, eid, iat, exp, jti }`. No PII in payload.
  - `exp`: restrict to event day; for online scan, accept if `now < exp`; for offline, also enforce local scan window.
  - `jti`: unique to prevent replay anomalies in logs; used during reconciliation.
- Storage: save only the ticket id/code and JWS (or regenerate on demand); store generated QR PNG/SVG in private storage; serve with signed URL TTL ≤ 10 min.
- Separation of duties: use distinct KMS keys for QR signing vs. webhook secrets; grant least privilege to functions.

### 21.3 Device Trust for Gate Scanning
- Registration: each device gets a unique device record and is assigned to specific `event_id`/`gate` with a short‑lived JWT (≤ 24h) minted from the server. Support just‑in‑time rotation.
- 2FA for staff: enforce passkeys/OTP on staff accounts. Session lifetime short; revoke on suspicion.
- Revocation: admin can revoke device JWT; device must renew periodically.
- Optional hardening (Phase 5+): client TLS certificates for native apps; for PWA, detect debugging and screen capture; risk scoring on device behavior (velocity, duplicates).

### 21.4 On‑Sale Anti‑Abuse & DDoS Controls
- Waiting room/queuing: enable Cloudflare Waiting Room (or equivalent) for on‑sale URLs (`/events/:id/buy`, `/v1/orders`).
- WAF & rate limit: block/shape traffic by IP ASN/geo, bot score, and per‑endpoint quotas (order create, holds, login). Shadow rules before blocking.
- Bot mitigation: use Turnstile/hCaptcha for risky actions (account creation, high‑velocity add‑to‑cart) with privacy‑preserving challenges. Avoid CAPTCHA for checkout UX unless attack detected.
- Inventory safety nets:
  - DB atomic decrement with `remaining_inventory >= :qty` condition.
  - Short‑lived reservations (TTL 10 min) to throttle holds.
  - Idempotency keys per client/order to avoid duplicate orders.

### 21.5 Online/Offline Scan Robustness
- Online first: transactional “consume” call sets `used_at` atomically; unique partial index ensures single OK path; realtime broadcast invalidates peers.
- Offline mode: verify JWS signature + `exp` + `event_id`; maintain local `used` set with disk persistence; debounce (e.g., 2–3s) for same code; reconcile to server on connectivity.
- Conflict resolution: first scan wins by earliest server receipt; later entries flagged as `duplicate`. Device clock skew bounded with NTP hints; include device time in payload for diagnostics.
- Time‑sliced acceptance (optional): issue short‑lived per‑hour tokens (`nbf/exp`) to reduce long‑window replays on stolen screenshots; app rotates the visible QR automatically; static PDF remains fallback but flagged as higher risk.

### 21.6 Network & Application Security
- CORS: strict allowlist for production web origins; block `*`. Separate API origin from web.
- Headers: CSP (nonce‑based, no `unsafe-inline`), HSTS (preload), Referrer‑Policy `strict-origin-when-cross-origin`, Permissions‑Policy least privilege, COOP/COEP for isolation, X‑Content‑Type‑Options `nosniff`.
- Secrets: never ship secrets in Vite client (`VITE_*` vars public). All secrets must live server‑side/KMS.
- Input validation: enforce zod/valibot schemas in every function; sanitize logs; attach request IDs.
- Rate limits by IP, user, and device for login, holds, order create, scan; exponential backoff on 429.

### 21.7 High Availability, Scale & DR
- Multi‑AZ primary DB with HA; read replicas for analytics; PITR backups; restore drills monthly.
- RTO/RPO targets: RTO ≤ 15 min, RPO ≤ 5 min. Verify via fire‑drills.
- Compute: stateless functions horizontally scaled; cold starts mitigated (provisioned concurrency where applicable).
- Multi‑region strategy: pin event projects to a region closest to venue; for nationwide scale, run per‑event region or use edge validation cache; offline scanning shields gates from WAN outages.
- Backpressure: use job queues for email/ticket rendering; retry with jitter; DLQ for failures.

### 21.8 Payments at Scale & Fraud Controls
- Provider: Midtrans/Xendit (ID focus) or Stripe; use hosted checkout (SAQ A), webhook‑driven state.
- Idempotent server: dedupe by `idempotency_key` and provider intent id; reconcile periodically.
- Anti‑fraud: device and velocity signals, BIN country vs. IP, blacklists/allowlists, 3DS where available.
- Refunds/voids: require dual control (two‑person approval) for large amounts.

### 21.9 Supply‑Chain Integrity
- Dependency hygiene: lockfiles, `npm ci`, Dependabot/Renovate, weekly SCA (e.g., Snyk), pinned integrity hashes.
- Build provenance: OIDC‑based deploy to cloud, signed builds (Sigstore/cosign) for functions; SBOM published per release.
- Secrets scanning: pre‑commit hooks + CI scanners; block commits with secrets.

### 21.10 Observability, SIEM & Audit
- Logs: structured JSON with `trace_id`, `user_id`, `order_id`, `ticket_id`; ship to SIEM (e.g., Datadog/Elastic) with retention and access controls.
- Metrics: funnel (view→cart→order→pay), provider latencies, webhook success rate, scan TPS, duplicate ratio, inventory drift.
- Alerts: webhook failures, payment declines spike, scan duplicates spike, auth failures spike, low inventory thresholds.
- Audit trails: immutable append‑only tables for critical actions; periodic review.

### 21.11 Privacy & Legal
- PCI DSS: keep card data out of scope via hosted payment pages.
- Indonesia PDP Law compliance: purpose limitation, data minimization, consent where required, cross‑border transfer safeguards, user data deletion workflows.
- Retention: purge PII post‑event according to policy; keep aggregates.

### 21.12 Validation & Assurance
- Security testing: SAST, DAST, dependency scanning, container scans; quarterly external pentest; red team exercises pre‑mega‑event.
- Chaos & load: simulate on‑sale burst; soak tests for gate scanning; packet loss and WAN outage drills (offline mode validation).

### 21.13 Implementation Checklist (Delta from Base Plan)
- Set up KMS; implement QR signing with `kid` rotation; JWKS endpoint for verifiers.
- Implement device registration, short‑lived JWT, revocation, renewal; staff 2FA.
- Enable WAF + Waiting Room + rate limits; Turnstile on risky flows.
- Enforce strict CSP/HSTS and CORS; secrets only server‑side.
- Add job queue for email/PDF; DLQ with alerting.
- Integrate SIEM; dashboards + alerts for all critical KPIs.
- Document IR playbooks; run DR and webhook replay drills.
