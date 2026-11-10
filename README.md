# compass

Web interface for Compass, an AI study companion that helps students plan their studies, manage learning goals, and track progress.

The backend API lives in [compass-backend](https://github.com/GIK302F-Project-Management/compass-backend).

## Tech stack

- React 19 + TypeScript
- Vite
- React Router

## Getting started

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

The app runs at http://localhost:5173.

## Scripts

| Command                | Description                                         |
| ---------------------- | --------------------------------------------------- |
| `npm run dev`          | Start the development server                        |
| `npm run build`        | Type-check and build for production                 |
| `npm run typecheck`    | Type-check only                                     |
| `npm run lint`         | Run ESLint                                          |
| `npm run format`       | Format the code with Prettier                       |
| `npm run format:check` | Check the formatting (used by CI)                   |
| `npm test`             | Run the tests once (`npm run test:watch` to watch)  |
| `npm run check`        | Everything CI runs: lint, format, tests, build      |
| `npm run preview`      | Preview the production build                        |

## Configuration

The backend address defaults to `http://localhost:8080`. To change it, copy `.env.example` to `.env.local` and edit `VITE_API_URL`.

## Authentication

Logging in gives the page an access token from the backend. It is kept in `localStorage` (`compass.session`) and sent on every
request as `Authorization: Bearer <token>`. Pages that need a login are wrapped in `RequireAuth`; `/login` and `/register` are
wrapped in `GuestOnly`. A token the backend refuses, or one that expires, ends the session and shows the login page.

`localStorage` is readable by any script running on the page, so the app must never render untrusted HTML. Tokens last two hours
to limit the damage if one leaks.

## Project structure

The code is grouped by what it is for (a feature), not by what kind of file it is. Everything one screen needs sits in one folder:
its pages, components, styles, API calls, validation and tests.

```
src/
├── main.tsx            # Starts the app
├── app/                # The shell that wires the features together: routes (App), error boundary, 404 page, design tokens
├── features/
│   ├── auth/           # Login, register, route guards (RequireAuth, GuestOnly)
│   ├── activities/     # The atlas (HomePage), an activity and its tasks (ActivityPage)
│   ├── goals/          # Learning goals
│   ├── plan/           # AI study plan: form, result and the last saved plan
│   ├── route/          # AI route planner (/route) and the route widgets shown on the home page
│   └── landing/        # Public landing page
│   Each feature has: *Page.tsx and components with their .css, api/ (server calls), validation/ (form rules)
├── shared/             # Used by several features. Never imports from features/ or app/ (enforced by ESLint)
│   ├── api/            # fetch wrapper that adds the token, API address
│   ├── hooks/          # useFormState, useDocumentTitle
│   ├── layout/         # Header, navigation, skip link, logos: what every page is wrapped in
│   ├── session/        # The login session kept in localStorage, and useSession
│   ├── styles/         # CSS used by many screens (buttons, forms, sheets...)
│   ├── ui/             # Generic pieces: form fields, icons, the map drawing shapes
│   └── utils/          # Dates and durations
└── test/               # Test setup and helpers
```

Rules that keep this tidy:

- Dependencies point one way: `app` -> `features` -> `shared`. ESLint fails the build if `shared` imports a feature, or a feature imports `app`.
- Inside a feature use relative imports. Across folders use the `@/` alias, which means `src/` (for example `@/shared/ui/FormField`).
- Tests sit next to the code as `*.test.ts[x]`. Each component has its stylesheet next to it, with the same name.
- Activities and tasks are kept in `localStorage` (`features/activities/api/activityStore.ts` and `taskStore.ts`) until the backend has endpoints for them.
  Only the files in that `api/` folder know about it, so switching to the backend changes one place.

## Workflow

- Create a branch per user story: `feature/US-<n>-short-description`
- Open a Pull Request to `main` and get at least one review before merging
- Commit messages: `US-<n>: short description`
