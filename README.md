<<<<<<< HEAD
# Frontend (Next.js + TypeScript)

This frontend is a responsive accounting dashboard built with Next.js and TypeScript.  
It connects to the backend API for authentication, accounts, transactions, invoices, bills, reports, and settings.

## Main features

- Authentication screens (login/signup)
- Dashboard with summary cards and charts
- Accounts, transactions, invoices, bills, customers, and suppliers management
- Reports with chart views and PDF/CSV export options
- Settings page for company profile and role management
- Light/dark theme toggle (light by default)
- Toast-based validation and API error feedback
- Mobile/tablet drawer navigation with icons
- Global Montserrat typography

## Environment variables

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Install and run

```bash
npm install
npm run dev
```

App runs on:

- [http://localhost:3000](http://localhost:3000)

## Available scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — start production server
- `npm run lint` — run lint checks

## API usage

All requests are made through `services/api.ts` using Axios.  
JWT is stored in local storage after login/signup and sent via `Authorization: Bearer <token>`.

## Notes

- UI money format uses **Rs**.
- PDF exports for invoices and bills are generated client-side.
- “Send” actions are placeholders until an email provider is integrated.

=======
# Accounting-Frontend
>>>>>>> 533c2e684e0c86b59bd9023489dbdfc432b27619
