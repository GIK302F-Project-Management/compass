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
│   ├── activities/     # The atlas of activities (Atlas), an activity and its tasks (ActivityPage)
│   ├── collaboration/  # Shared plans (/plans): plan list, members, invitation links (/join/<token>), plan progress
│   ├── home/           # The page after login: the atlas plus the route card/trail. Built from activities, route and collaboration
│   ├── goals/          # Learning goals
│   ├── planner/        # The Planner page (/planner): one page, two ways to plan. Built from route and plan
│   ├── plan/           # Plan by hand (QuickPlan): type goals and hours, get a daily plan
│   ├── route/          # Plan from activities (RoutePlanner): the tasks of your activities, plus the route widgets of the home page
│   └── landing/        # Public landing page
│   Each feature has: *Page.tsx and components with their .css, api/ (server calls), validation/ (form rules)
├── shared/             # Used by several features. Never imports from features/ or app/ (enforced by ESLint)
│   ├── api/            # fetch wrapper that adds the token, API address, the study-plans endpoint both planners use
│   ├── hooks/          # useFormState, useDocumentTitle
│   ├── layout/         # Header, navigation, skip link, logos: what every page is wrapped in
│   ├── plans/          # The plan the student works in (CurrentPlanProvider, useCurrentPlan, WithCurrentPlan)
│   ├── session/        # The login session kept in localStorage, and useSession
│   ├── styles/         # CSS used by many screens (buttons, forms, sheets...)
│   ├── ui/             # Generic pieces: form fields, icons, the map drawing shapes
│   └── utils/          # Dates and durations
└── test/               # Test setup and helpers
```

Rules that keep this tidy:

- Dependencies point one way: `app` -> `features` -> `shared`. ESLint fails the build if `shared` imports a feature, or a feature imports `app`.
- Between features there is one chain, `home` -> `route` -> `activities`, plus `home` -> `collaboration` and `planner` -> `route`/`plan`, also enforced by ESLint. Code that needs two features at once goes in `home` (or `app`), never in a cycle.
- One definition per thing: `POST /api/study-plans` is called by `generateStudyPlan` in `shared/api/studyPlans.ts` (both planners use it), and durations are formatted by `formatMinutes` in `shared/utils/duration.ts` ("2h 15m").
- Inside a feature use relative imports. Across folders use the `@/` alias, which means `src/` (for example `@/shared/ui/FormField`).
- Tests sit next to the code as `*.test.ts[x]`. Each component has its stylesheet next to it, with the same name.
- Activities and tasks live in the backend, inside a **plan** (`shared/api/plans.ts`, `features/activities/api/`). Every student has a
  personal plan ("My plan"); any plan can be shared with an invitation link (`/join/<token>`), and its members all see and
  edit the same activities. The plan the student works in is chosen in the header (`shared/plans/`) and remembered per account.
- Activities saved in the browser by Sprint 1 are offered for moving into the current plan (`LegacyImportBanner` in the atlas, `features/activities/api/legacyData.ts`);
  this code can be deleted once nobody has old data left.
- Only the saved AI route (`features/route/api/savedRoute.ts`) is still kept in `localStorage`, per account and plan.

## Workflow

- Create a branch per user story: `feature/US-<n>-short-description`
- Open a Pull Request to `main` and get at least one review before merging
- Commit messages: `US-<n>: short description`
