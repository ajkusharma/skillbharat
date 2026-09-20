# Deploying SkillBharat with GitHub

**Pipeline:** push to `main` → GitHub Actions runs the tests → builds the backend and frontend Docker images → pushes them to GitHub Container Registry (GHCR) → SSHes into your server → `docker compose pull && up -d`.

```
GitHub repo ──push──▶ Actions (test, build) ──▶ ghcr.io/<you>/skillbharat-{backend,frontend}
                                   │
                                   └─ ssh ─▶ your server:  Caddy (HTTPS) → nginx (web) → Spring Boot API → PostgreSQL
                                                                                        └─ resumes volume
```

GitHub Pages cannot host this on its own: it only serves static files, and the app needs the API and database. Actions and GHCR do the building and delivery; you still need a machine (or platform) to run the containers.

## What you need

- A GitHub repository (private is fine).
- A Linux server with Docker, 2 GB RAM or more, ports 22/80/443 open. Any provider works (AWS Lightsail/EC2 in `ap-south-1` Mumbai, DigitalOcean Bangalore, Hetzner, and so on).
- A domain name with an **A record** pointing at the server's IP. Caddy needs it to issue the HTTPS certificate.

## One-time setup

### 1. Push the code to GitHub
```bash
cd skillbharat
git init && git add . && git commit -m "SkillBharat MVP"
git branch -M main
git remote add origin git@github.com:<your-username>/skillbharat.git
git push -u origin main
```
`.env` files are git-ignored, so no secrets are committed. The first push triggers the pipeline; it will fail at the deploy step until steps 2 to 4 are done. That is expected.

### 2. Prepare the server
```bash
# as root on the server (Ubuntu example)
curl -fsSL https://get.docker.com | sh
adduser --disabled-password --gecos "" deploy && usermod -aG docker deploy
mkdir -p /opt/skillbharat && chown deploy:deploy /opt/skillbharat
```
Create `/opt/skillbharat/.env` (owner `deploy`, mode 600):
```bash
DOMAIN=jobs.example.com
POSTGRES_PASSWORD=<long random>
JWT_SECRET=<openssl rand -base64 48>
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=<strong password>
```
`ADMIN_EMAIL`/`ADMIN_PASSWORD` create the first Super Admin on first start. There is no change-password screen in the MVP yet, so choose a strong password now.

### 3. Give GitHub a way in (deploy key)
```bash
ssh-keygen -t ed25519 -f deploy_key -N "" -C "github-actions-deploy"
ssh-copy-id -i deploy_key.pub deploy@<server-ip>        # or append it to /home/deploy/.ssh/authorized_keys
ssh-keyscan -H <server-ip>                              # copy this output for SSH_KNOWN_HOSTS
```

### 4. Add the GitHub secrets
Repository → **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Value |
|---|---|
| `SSH_HOST` | server IP or hostname |
| `SSH_USER` | `deploy` |
| `SSH_KEY` | contents of the private `deploy_key` file |
| `SSH_KNOWN_HOSTS` | output of `ssh-keyscan -H <server-ip>` (pins the server's identity) |
| `SSH_PORT` | only if not 22 |

Then delete the local `deploy_key` copy or store it in a password manager.

### 5. Deploy
Push to `main` (or **Actions → Deploy → Run workflow**). Watch the run; when it is green, open `https://<your-domain>`. The first request may take a few seconds while Caddy obtains the certificate.

Sign in with `ADMIN_EMAIL`/`ADMIN_PASSWORD`. The production stack has demo data **off**, so the site starts empty: register an employer, approve it as admin, and so on.

## Day-to-day

| Task | How |
|---|---|
| Release | merge to `main` |
| Require a manual OK before deploying | Settings → Environments → `production` → *Required reviewers* |
| Logs | `docker compose -f docker-compose.prod.yml logs -f backend` (in `/opt/skillbharat`) |
| Roll back | `IMAGE_TAG=<older commit sha> GHCR_OWNER=<you> docker compose -f docker-compose.prod.yml up -d` (every build is tagged with its commit SHA) |
| Back up | database: `docker compose -f docker-compose.prod.yml exec -T db pg_dump -U skillbharat skillbharat > backup.sql`; resumes: the `resumes` Docker volume. Schedule both with cron and copy them off the server |
| Update dependencies | Dependabot (`.github/dependabot.yml`) opens monthly PRs; CI must pass before merge |

## Notes and limits

- **Resumes live on the server's disk** (the `resumes` volume). That is fine for one server. To run several instances or a platform with ephemeral disks, implement `FileStorage` for S3/GCS/Blob first (the interface is already in place).
- **Swagger/OpenAPI is switched off** in production (`SPRINGDOC_*` variables in `docker-compose.prod.yml`). Remove those two lines if you want it.
- The database is not published to the internet; only Caddy listens on 80/443.
- Not in the MVP, worth adding before real traffic: login rate limiting, password reset, error monitoring, automated backups.

## Using a managed platform instead

If you would rather not run a server, Render, Railway or Fly.io can deploy straight from the GitHub repo:
create a managed PostgreSQL; deploy `backend/` as a Docker service with the same environment variables as in `docker-compose.prod.yml` (`DB_URL` in `jdbc:postgresql://...` form); deploy `frontend/` as a second service and change its `nginx.conf` `proxy_pass` to the backend's URL (or serve the frontend as a static site and set `VITE_API_BASE_URL` at build time plus `CORS_ALLOWED_ORIGINS` on the backend). Resume storage needs the S3 implementation mentioned above on these platforms.
