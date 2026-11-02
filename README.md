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

| Command           | Description                         |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Start the development server        |
| `npm run build`   | Type-check and build for production |
| `npm run lint`    | Run ESLint                          |
| `npm run preview` | Preview the production build        |

## Project structure

```
src/
├── api/          # API clients (auth, activities, tasks, session)
├── components/   # Reusable UI components
├── mocks/        # Mock data used until the backend is connected
├── pages/        # Route pages
├── utils/        # Helpers
└── validation/   # Form validation
```

## Workflow

- Create a branch per user story: `feature/US-<n>-short-description`
- Open a Pull Request to `main` and get at least one review before merging
- Commit messages: `US-<n>: short description`
