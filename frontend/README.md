# Bespoke Inventory Frontend

React + TypeScript + Vite frontend for the inventory tracking system.

## Run

```bash
npm install
copy .env.example .env
npm run dev
```

Default API base URL is:

`http://localhost:5001/api/v1`

Make sure backend is running and seeded before frontend login.

## Build

```bash
npm run build
```

## Quality Checks

```bash
npm run lint
```

## Tech Stack

- React 19
- TypeScript 5
- Vite 8
- React Router
- TanStack Query
- Recharts
- Tailwind CSS 4 (tokenized custom styling)

## Notes

- App routes are configured in `src/router/index.tsx`.
- Shared layout primitives are in `src/components/layout/`.
- Design tokens and utility classes are in `src/index.css`.
