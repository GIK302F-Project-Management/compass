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

```
src/
├── api/          # API clients (auth, http with token, session, study plan, activities, tasks)
├── components/   # Reusable UI components (RouteGuards: login-protected routes)
├── hooks/        # React hooks (useSession, useFormState)
├── mocks/        # Mock data used until the backend is connected
├── pages/        # Route pages
├── test/         # Test setup and helpers (tests sit next to the code as *.test.ts[x])
├── utils/        # Helpers
└── validation/   # Form validation
```

## Workflow

- Create a branch per user story: `feature/US-<n>-short-description`
- Open a Pull Request to `main` and get at least one review before merging
- Commit messages: `US-<n>: short description`
