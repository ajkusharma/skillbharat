# SkillBharat API

Base path `/api`. JSON in and out (resume upload is `multipart/form-data`). Authenticated calls send `Authorization: Bearer <token>`.
Interactive docs: `http://localhost:8080/swagger-ui.html` (OpenAPI JSON at `/v3/api-docs`).

## Conventions

- **Paging**: `page` (0-based) and `size`. Responses: `{ items, page, size, totalItems, totalPages }`.
- **Errors**: `{ timestamp, status, error, message, fieldErrors? }`.

| Status | Meaning |
|---|---|
| 400 | Validation failed or business rule broken (`fieldErrors` lists bad fields) |
| 401 | Missing, invalid or expired token, or a bad email/password |
| 403 | Signed in, but the role may not do this (or the account is deactivated at login) |
| 404 | Not found, **or not yours** (ownership failures deliberately look like 404) |
| 409 | Conflict: duplicate email, already applied, state already set |
| 413 | Resume larger than 5 MB |

- **Money** is whole rupees per month (`salaryMin`, `salaryMax`). **Dates** are ISO-8601 (UTC instants, `LocalDate` for experience dates).

## Endpoints

### Auth (public)
| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/register/candidate` | `{fullName, email, phone, password}` → `{token, user}` (201) |
| POST | `/auth/register/employer` | adds `{companyName, city, state}`; creates the company as `PENDING` (201) |
| POST | `/auth/login` | `{email, password}` → `{token, user}` |
| GET | `/auth/me` | current user (any signed-in role) |

Phone: 10-digit Indian mobile (`[6-9]xxxxxxxxx`). Password: 8-72 chars with a letter and a number.

### Public (no sign-in)
| Method | Path | Purpose |
|---|---|---|
| GET | `/public/jobs` | search. Query: `keyword`, `city`, `category`, `skillId`, `page`, `size` (max 50) |
| GET | `/public/jobs/{id}` | job detail. With a job seeker's token it also returns `viewer: {applied, applicationStatus, saved}` |
| GET | `/public/meta` | all skills, trade categories with open-job counts, headline stats |

### Job seeker (`JOB_SEEKER`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/candidate/profile` | own profile with `completeness` (0-100) |
| PUT | `/candidate/profile` | replace profile: contact, location, headline, summary, experience years, `skillIds`, `education[]`, `experience[]` |
| POST | `/candidate/resume` | multipart field `file` (pdf/doc/docx, ≤ 5 MB) (201) |
| POST | `/candidate/jobs/{jobId}/apply` | `{coverNote?}`. Needs a city on the profile. 409 if already applied (201) |
| GET | `/candidate/applications` | my applications, newest first, with status |
| GET | `/candidate/saved-jobs` | saved jobs that are still open |
| POST | `/candidate/saved-jobs/{jobId}` | save (idempotent) (204) |
| DELETE | `/candidate/saved-jobs/{jobId}` | unsave (204) |

### Employer (`EMPLOYER`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/employer/dashboard` | company status, job counts by status, application counts by status |
| GET | `/employer/company` | own company |
| PUT | `/employer/company` | update. Saving a `REJECTED` company resubmits it as `PENDING` |
| GET | `/employer/jobs` | own jobs with `applicationCount` |
| POST | `/employer/jobs` | create as `DRAFT`. 403 until the company is `APPROVED` (201) |
| GET | `/employer/jobs/{id}` | own job |
| PUT | `/employer/jobs/{id}` | edit. An `APPROVED` or `REJECTED` job returns to `DRAFT` |
| POST | `/employer/jobs/{id}/submit` | `DRAFT` → `PENDING_APPROVAL` |
| GET | `/employer/applications` | applications to own jobs. Query: `jobId`, `status`, `page`, `size` |
| GET | `/employer/applications/{id}` | application + full candidate profile + `resumeId` |
| PATCH | `/employer/applications/{id}/status` | `{status: "SHORTLISTED" \| "REJECTED"}` (audited) |

### Admin (`ADMIN`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/dashboard` | platform counts and applications by status |
| GET | `/admin/users` | query `role`, `q`, paging |
| PATCH | `/admin/users/{id}/active` | `{active}`. Not allowed on yourself (audited) |
| GET | `/admin/employers` | query `status`, `q`, paging |
| POST | `/admin/employers/{id}/approve` | (audited) |
| POST | `/admin/employers/{id}/reject` | `{reason}` (audited) |
| GET | `/admin/jobs` | query `status`, `q`, paging |
| GET | `/admin/jobs/{id}` | full job for review |
| POST | `/admin/jobs/{id}/approve` | only from `PENDING_APPROVAL`; publishes (audited) |
| POST | `/admin/jobs/{id}/reject` | `{reason}`; only from `PENDING_APPROVAL` (audited) |
| PATCH | `/admin/jobs/{id}/active` | `{active}` switch a live job on/off (audited) |
| GET | `/admin/applications` | all applications, query `status`, paging |
| GET | `/admin/audit-logs` | activity log, newest first |

### Resumes (any signed-in role, access-checked)
| Method | Path | Purpose |
|---|---|---|
| GET | `/resumes/{id}/download` | the owner, an admin, or an employer who received it with an application. Otherwise 404 |

## Example: the success scenario with curl

```bash
API=http://localhost:8080/api

# 1. candidate registers and gets a token
TOKEN=$(curl -s $API/auth/register/candidate -H 'Content-Type: application/json' \
  -d '{"fullName":"Meena Kumari","email":"meena@example.com","phone":"9876501234","password":"Passw0rd1"}' | jq -r .token)

# 2. profile, resume, search, apply
curl -s -X PUT $API/candidate/profile -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"fullName":"Meena Kumari","phone":"9876501234","city":"Jaipur","state":"Rajasthan","skillIds":[1]}'
curl -s -X POST $API/candidate/resume -H "Authorization: Bearer $TOKEN" -F file=@resume.pdf
curl -s "$API/public/jobs?keyword=electrician&city=Jaipur"
curl -s -X POST $API/candidate/jobs/1/apply -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"coverNote":"Can join next week"}'

# 3. employer (demo account) shortlists
ETOKEN=$(curl -s $API/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"hr@rajasthanelectricals.in","password":"Demo@1234"}' | jq -r .token)
curl -s -X PATCH $API/employer/applications/1/status -H "Authorization: Bearer $ETOKEN" \
  -H 'Content-Type: application/json' -d '{"status":"SHORTLISTED"}'

# 4. candidate sees SHORTLISTED
curl -s $API/candidate/applications -H "Authorization: Bearer $TOKEN"
```
