## Youth Music Academy — Frontend (React + Vite + Tailwind)

### Scripts

- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run preview` — preview build
- `npm run lint` — run ESLint

### Environment

Create a `.env` file in this folder:

```
VITE_API_BASE_URL=http://localhost:4000/api
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
VITE_RAZORPAY_KEY_ID=rzp_test_xxx
```

Do not commit real secrets here. Only values prefixed with `VITE_` are exposed to the browser.

### Tailwind CSS

Tailwind v4 is enabled via a single import in `src/index.css`:

```
@import "tailwindcss";
```

### Development

1. Install deps: `npm install`
2. Start dev: `npm run dev`
3. Ensure the backend is running on `http://localhost:4000` or update `VITE_API_BASE_URL`.
