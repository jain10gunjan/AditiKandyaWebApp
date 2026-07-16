# Music School Backend

Node.js + Express + MongoDB API for The MusiNest.

## Scripts

- `npm run dev` — start with Nodemon
- `npm start` — start production
- `npm run lint` — ESLint
- `npm run format` — Prettier

## Environment

Copy `.env.example` to `.env` and fill values:

```
PORT=4000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<db>?retryWrites=true&w=majority
CLERK_SECRET_KEY=sk_test_xxx
CLERK_PUBLISHABLE_KEY=pk_test_xxx
ADMIN_EMAILS=admin@example.com
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
```

## Project structure

```
src/
  server.js              # process entry (DB connect + listen)
  app.js                 # Express app (middleware + routes)
  config/                # env, cors, db, paths, constants
  models/                # Mongoose models
  middleware/            # auth, upload, errors, cors helpers
  utils/                 # shared helpers (enrollment, tokens, media)
  seeds/                 # demo seed data
  routes/                # HTTP route registration by domain
    admin/               # admin-only route modules
    deps.js              # shared route dependencies
    index.js             # mounts all route modules
```

## Development

1. `npm install`
2. `npm run dev`
3. Health check: `GET http://localhost:4000/api/health`
