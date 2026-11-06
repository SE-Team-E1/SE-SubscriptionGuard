# SubscriptionGuard frontend

## Recommended: complete local Docker setup

From the repository root:

```sh
./scripts/dev.sh
docker compose -f compose.yml -f compose.dev.yml exec backend python manage.py seed_local
```

Open http://localhost:8080. Development mode uses the real Django API and
logs in as the seeded `demo` account. No host Node.js installation or frontend
`.env.local` is needed. Only use local test credentials: Vite values are visible
in browser code. Override `LOCAL_API_USERNAME` and `LOCAL_API_PASSWORD` in the
root `.env` if using another local account.

Use `./scripts/stop.sh` to stop, or `./scripts/integration.sh` to switch to the
packaged application. Both retain database data. The packaged frontend does
not include development auto-login and still needs the user-facing login feature;
until then, test authenticated API calls separately through Swagger.

See [Deployment & Betrieb](docs/technical/deployment.adoc) for configuration,
seeding, reset commands, and the CI/release plan.

## Alternative: host Vite with backend containers — temporary first draft

This is a **temporary first draft** of the local development setup. It documents
this branch's current workflow and will need revisiting when the frontend login
feature is integrated. It is not a production deployment guide.

### 1. Prerequisites

Install Git, Node.js 24 with npm, and Docker Desktop with Docker Compose. Start
Docker Desktop. Python and PostgreSQL are provided by the containers.

```sh
git --version
node --version
npm --version
docker compose version
```

Keep ports 5173 (frontend), 8001 (backend), 5432 (PostgreSQL), and 5050 (pgAdmin)
available. Automated UI tests use port 4173.

Run the following setup steps from the repository root unless stated otherwise.

### 2. Configure and start the backend

```sh
cd src/backend/django
cp .env.example .env
```

Edit `.env` and replace the `SECRET_KEY`
placeholder with a random local secret. On macOS/Linux, `openssl rand -hex 32`
can generate a value. Copy the output into `SECRET_KEY`, then start the containers:

```sh
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

Use **both Compose files** for this workflow. The development override builds the
backend from local source and configures PostgreSQL, including overriding the
example's `USE_POSTGRESQL=false`. It also supplies local database and pgAdmin
credentials. Django applies database migrations automatically on startup.

Check startup from the same directory:

```sh
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs --tail=100 web
```

The initial image build and database startup can take a while. Wait until Django
is running, then open the [API documentation](http://localhost:8001/api/schema/swagger/).
If the API is not ready, inspect the logs; do not continue with account creation
until the backend responds.

### 3. Create a local test account

For this temporary local setup, create a superuser interactively:

```sh
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec web python manage.py createsuperuser
```

Follow the prompts and retain the username and password for the frontend
configuration. This account has administrator privileges in this local database;
it does not create an account or grant privileges in a deployed environment.
Administrator privileges are unnecessary for the app's normal API operations.
A regular test account can alternatively be created through
`POST /api/auth/register/` in Swagger.

The account and subscriptions persist in the Docker database volume after the
containers stop. Account creation is only required once for a fresh database.

### 4. Configure and start the frontend

In a second terminal, open the cloned repository and run:

```sh
cd src/frontend
cp .env.example .env.local
npm ci
```

These copy commands assume a clean setup. Keep existing `.env` and `.env.local`
files when restarting an already configured checkout. `npm ci` installs the
lockfile versions; the install script also downloads Cypress.

Edit `.env.local` to use the account created above:

```dotenv
VITE_USE_MOCK_REPOSITORIES=false
VITE_DEV_API_USERNAME=your-local-username
VITE_DEV_API_PASSWORD=your-local-password
```

Start Vite:

```sh
npm run dev
```

Open the URL printed by Vite, normally [localhost:5173](http://localhost:5173).
Vite forwards `/api` requests to the backend at `localhost:8001`.

The frontend currently logs in automatically with these development credentials,
keeps the access token in memory, and logs in again after a 401 response before
retrying the request once. There is no user-facing login flow on this branch.
Restart Vite after editing `.env.local`.

The auto-login helper is development-only and is disabled in production builds.
`VITE_*` values are accessible to browser code: use local test credentials and do
not commit `.env` or `.env.local`. Production authentication and API routing need
their own setup.

### 5. Verify the app manually

Create a subscription through **Add**, then open **Subscriptions**. Confirm the
name, price, currency symbol, and selected category icon. Reload the page to
confirm the subscription was saved in the backend. A fresh account initially has
no subscriptions; providers and categories are shared between authenticated users.

### 6. Run automated checks

Run these commands from `src/frontend`:

```sh
npm run test:unit -- --run
npm run build
npm run test:e2e
npm run test:e2e:mock
```

- `test:unit` runs unit tests once.
- `build` checks TypeScript and creates the production build.
- `test:e2e` starts a preview server and runs Cypress with intercepted API responses.
  Run `build` first.
- `test:e2e:mock` starts Vite in mock mode and runs `cypress/mock` tests against
  the app's in-memory repositories.

The two UI suites start and stop their own server on port 4173. Run them
sequentially with that port free. Neither suite requires a running backend;
manual testing against Django is a separate check.

For interactive Cypress tests against the development server:

```sh
npm run test:e2e:dev
```

For linting:

```sh
npm run lint
```

The lint command automatically fixes files where possible.

### 7. Optional frontend-only development

Stop the existing Vite process with Ctrl+C, then run from `src/frontend`:

```sh
npm run dev -- --mode mock
```

This uses `.env.mock` to select the in-memory repositories. No backend or account
is required. Created subscriptions survive navigation within the app but reset on
page reload.

### 8. Stop and restart

Stop Vite with Ctrl+C. From `src/backend/django`, stop the backend containers:

```sh
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

This preserves database volumes. On subsequent starts, run from the same directory:

```sh
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

Then run `npm run dev` from `src/frontend`. Rebuild the backend with
`up -d --build` after changing backend source or dependencies, since source is
copied into the image rather than mounted for live reload. Run `npm ci` again
when the frontend lockfile changes.

### Common startup problems

- **Port already in use:** stop the conflicting process. PostgreSQL commonly
  conflicts on 5432; UI test servers require 4173.
- **401 or development-login failure:** verify the account exists in this local
  database, check `.env.local`, and restart Vite. Creating a superuser does not
  automatically configure the frontend credentials.
- **Connection refused or 502:** check Docker is running and inspect the `web`,
  `db`, and `nginx` logs with the same two Compose files.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).
