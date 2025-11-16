## Youth Music Academy — Backend (Node.js + Express + MongoDB)

### Scripts

- `npm run dev` — start with Nodemon
- `npm start` — start production
- `npm run lint` — ESLint
- `npm run format` — Prettier

### Environment

Create a `.env` file in this folder:

```
PORT=4000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<db>?retryWrites=true&w=majority
CLIENT_ORIGIN=http://localhost:5173
CLERK_SECRET_KEY=sk_test_xxx
CLERK_PUBLISHABLE_KEY=pk_test_xxx
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
```

### Endpoints

- `GET /api/health`
- `GET /api/courses`
- `GET /api/teachers`
- `POST /api/enroll`
- `POST /api/dev/seed` (dev only)

### Development

1. Install deps: `npm install`
2. Start dev: `npm run dev`
3. Seed sample data: `POST http://localhost:4000/api/dev/seed`


