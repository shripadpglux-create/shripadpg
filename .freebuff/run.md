# Run doc — Shripad PG (TanStack Start)

## Reproduce the uncommitted artifacts a fresh checkout needs

1. **Environment file (`.env`)** — copy `.env` from the main checkout into the project root
   (do NOT commit; contains `MONGODB_URI`, `JWT_SECRET`, `APP_URL`). The values are secrets
   and must be recreated/copied manually; no default is recorded here.
2. **Dependencies** — the repo has both `bun.lock` and `package-lock.json`. `bun` is NOT
   installed on this machine, so install with npm from the root:
   ```sh
   npm install
   ```
   (`node_modules` already exists in the current checkout.)

## Run the dev server

- Start the Vite dev server (TanStack Start, SSR):
  ```sh
  npm run dev
  ```
- The Lovable config (`@lovable.dev/vite-tanstack-config`) defaults to **port 8080**,
  host `::`. Use `http://localhost:8080/`.
- If port 8080 is taken, pass a free one explicitly, e.g. `npm run dev -- --port 8081`.
- Detached run with logging (used for the Preview tab):
  ```sh
  nohup npm run dev > .freebuff/preview-1f7e455a-0300-4d2d-9836-89c9411632b3.log 2>&1 &
  ```
- Sandbox mode (port 8080/strictPort) only activates when `LOVABLE_SANDBOX=1` or
  `DEV_SERVER__PROJECT_PATH` is set — not the case locally.
- Routes: `/` landing, `/admin` admin dashboard, `/resident` resident portal, `/login`.
