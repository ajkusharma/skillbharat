# SkillBharat

**Skilled Hands. Stronger India.**

An MVP recruitment marketplace for skilled workers in India (electricians, welders, mechanics, CNC operators, drivers and more). It implements one complete hiring workflow and nothing else:

> Job Seeker → Find Job → Apply → Employer Reviews → Shortlist / Reject → Admin Oversees

| | |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | Java 21, Spring Boot 3.5 (modular monolith), Spring Security + JWT + RBAC |
| Data | PostgreSQL 16, Spring Data JPA, Flyway migrations |
| Ops | Docker Compose (db + api + web), OpenAPI / Swagger UI |

Docs: [implementation plan + ERD](docs/IMPLEMENTATION_PLAN.md), [API reference](docs/API.md), [deployment with GitHub](docs/DEPLOYMENT.md)

---

## Quick start (Docker)

```bash
docker compose up --build
```

| What | Where |
|---|---|
| Web app | http://localhost:3000 |
| API | http://localhost:8080/api |
| API docs (Swagger UI) | http://localhost:8080/swagger-ui.html |

The first start runs the migrations and loads demo data. The sign-in page has one-click demo logins.

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Super Admin | `admin@skillbharat.in` | `Admin@1234` |
| Employer (approved) | `hr@rajasthanelectricals.in` (Jaipur, electrical) | `Demo@1234` |
| Employer (approved) | `hiring@capitalbuild.in` (Delhi, construction) | `Demo@1234` |
| Employer (approved) | `careers@nammaauto.in` (Bengaluru, automotive) | `Demo@1234` |
| Employer (approved) | `jobs@punetooling.in` (Pune, CNC machining) | `Demo@1234` |
| Employer (approved) | `ops@meridianfacility.in` (Mumbai, logistics) | `Demo@1234` |
| Employer (**pending approval**) | `contact@konkanfab.in` | `Demo@1234` |
| Job seeker | `ravi.meena@example.com` (Jaipur electrician, has resume) | `Demo@1234` |
| Job seeker | `kavita.sharma@example.com` (fresher, **no resume**) | `Demo@1234` |
| Job seeker | `imran.qureshi@example.com`, `arjun.gowda@example.com`, `pooja.patil@example.com`, `sandeep.yadav@example.com` | `Demo@1234` |

Seed data: 6 employers, 18 jobs across Jaipur, Delhi, Mumbai, Bengaluru and Pune (live, awaiting approval, rejected with a reason, and draft), 6 candidates, 13 applications in every status, saved jobs, generated PDF resumes, and some audit history.

### See the whole workflow in five minutes

1. Sign in as **Ravi** → *Applications*: he is already shortlisted for one job. Open a live job and apply to another.
2. Sign in as **hr@rajasthanelectricals.in** → *Applications* → *Review*: view the profile and resume, **Shortlist** or **Reject**.
3. Back as Ravi: the status changed. (Applicants see it on the overview and in *Applications*.)
4. Sign in as **admin** → *Employers*: approve **Konkan Fab Works**. *Jobs*: approve or reject the jobs awaiting approval (rejection needs a reason the employer will see). Try switching a live job off, or deactivating a user (they are locked out on their next request).
5. *Activity log* shows every one of those actions.

Also try: register a brand-new employer, watch the "waiting for approval" banner, approve it as admin, post a job, approve it, and find it on the public site.

---

## Local development

Prerequisites: Java 21, Maven 3.9+, Node 20+ (22 recommended), Docker (for the database and tests).

```bash
# 1. database only
docker compose up -d db

# 2. API on :8080 (defaults connect to the compose database and seed demo data)
cd backend && mvn spring-boot:run

# 3. web app on :5173 (Vite proxies /api to :8080)
cd frontend && npm install && npm run dev
```

### Tests

```bash
cd backend && mvn verify      # needs Docker (Testcontainers starts PostgreSQL)
cd frontend && npm run build  # type-checks, then builds
```

`WorkflowIT` runs the MVP success scenario end to end against a real PostgreSQL: candidate registers → profile → resume → finds job → applies → employer sees it → shortlists → candidate sees `SHORTLISTED` → admin sees the whole trail. It also asserts the RBAC and ownership rules (wrong role → 403, another employer's data → 404, deactivated user → locked out, resume access).

---

## Configuration

Set through environment variables (see `.env.example`).

| Variable | Default | Purpose |
|---|---|---|
| `JWT_SECRET` | dev-only value | **Must** be set to 32+ random characters outside local development |
| `SEED_DEMO_DATA` | `true` | Load demo data on first start. Use `false` in production |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | empty | Creates the first Super Admin when none exists |
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | local compose db | PostgreSQL connection |
| `STORAGE_DIR` | `./data/resumes` (`/data/resumes` in Docker) | Where resumes are stored |
| `CORS_ALLOWED_ORIGINS` | localhost:3000, :5173 | Only needed if the web app is served from another origin |
| `JWT_EXPIRATION_MINUTES` | `480` | Token lifetime |

Production checklist: strong `JWT_SECRET`, `SEED_DEMO_DATA=false`, `ADMIN_EMAIL`/`ADMIN_PASSWORD` for the first admin (choose a strong password up front; there is no change-password screen yet), remove the published `5432` port from `docker-compose.yml`, put TLS in front (reverse proxy or load balancer).

**Deploying with GitHub Actions** (build images, push to GHCR, deploy over SSH with automatic HTTPS): see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## Project layout

```
skillbharat/
├── docker-compose.yml        local stack (builds from source)
├── docker-compose.prod.yml   production stack (pulls images from GHCR) + Caddyfile
├── .github/workflows/        CI (pull requests) and Deploy (main)
├── docs/                     implementation plan (ERD), API reference
├── backend/
│   └── src/main/java/com/skillbharat/
│       ├── web/              REST controllers + dto/ (records)
│       ├── service/          business rules, transactions, query specs, mappers
│       ├── repository/       Spring Data repositories
│       ├── domain/           JPA entities and enums
│       ├── security/         JWT service/filter, security config (RBAC)
│       ├── storage/          FileStorage interface + local-disk implementation
│       ├── bootstrap/        first-admin bootstrap, demo data seeder
│       ├── common/           ApiException + global error handler
│       └── config/           typed properties, OpenAPI
│   └── src/main/resources/db/migration/   V1 schema, V2 skills reference data
└── frontend/
    └── src/
        ├── pages/            public/, candidate/, employer/, admin/
        ├── components/       layouts, UI kit, job card, skill picker
        ├── context/          auth + toasts
        └── lib/              API client, types, ₹/date formatting
```

## Security summary

- Backend-enforced RBAC: URL rules per role plus ownership checks in every service. The frontend route guards are only a convenience.
- Passwords hashed with BCrypt. JWT is stateless, but the user is reloaded on each request so deactivation and role changes apply immediately.
- Candidates read only their own profile and applications; employers only their own company, jobs and applications (foreign ids return 404).
- Resumes: type allow-list (PDF/DOC/DOCX), 5 MB cap, file-signature check, random storage names, access only for the owner, an admin, or the employer that received it.
- All request bodies validated; uniform error format; no stack traces or internals in responses.
- Admin actions (and employer shortlist/reject decisions) are audit-logged in the same transaction.

## Decisions worth knowing about

These fill gaps in the brief; each is easy to change.

- **Role is an enum**, not a table: three fixed roles that drive URL access rules.
- **Employer registration creates the company** (status `PENDING`), so "register → company profile → approval" is one step plus a profile page. Employers cannot post until approved.
- **Editing a live or rejected job sends it back to `DRAFT`** so approved content cannot be silently changed. The UI warns before saving.
- **Resume is encouraged, not required** to apply (many skilled workers do not have one); the profile-strength meter and warnings nudge them. The resume on file at apply time is what the employer sees.
- **A job is public only if** approved, switched on, and its employer is approved and active.
- Employers can toggle between *Shortlisted* and *Rejected* (never back to *Applied*).
- Hibernate runs with `ddl-auto: validate`. If you change the schema, add a Flyway migration. If a startup validation error ever blocks you, `SPRING_JPA_HIBERNATE_DDL_AUTO=none` is a temporary escape hatch.

## Not in the MVP (natural next steps)

Email/SMS notifications, email verification and password reset, login rate limiting / lockout, refresh tokens (or httpOnly cookies), S3-compatible resume storage (swap the `FileStorage` bean), job expiry dates, candidate withdrawal, employer team members, full-text search at scale, an admin-managed skills catalogue.
