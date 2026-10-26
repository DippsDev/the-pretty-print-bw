# thePRETTYPRINT

thePRETTYPRINT is the booking site for a hair studio. A client can look through the menu, choose a style, pick a stylist, and reserve a time. Staff who are on the allowlist can sign in and keep the menu, prices, and bookings up to date.

Prices on the public menu are in Botswana pula.

## Pages

- **Home** shows the studio wordmark.
- **Book** walks through services, stylist, time, and confirmation. Service groups sit in a horizontal slider: Ponytails, Half up half down, Sew-in and quickweaves, Extras, Wig services, and Packages.
- **Contact** is where a client can reach the studio.
- **Admin** is locked. Only the emails in `ADMIN_EMAILS` can sign in. From there, staff can edit services and prices, read booking details, cancel a booking, and record a refund.

A chat assistant sits on the pages and can help a visitor find a service.

## Stack

The app is [Next.js](https://nextjs.org) 15 with the App Router, React 19, and Tailwind CSS. Booking state lives in Redux. Page changes use Framer Motion.

## Run it locally

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm run build
npm run start
npm run lint
```

## Configuration

Create a `.env.local` file in the project root. Do not commit it. Next.js reads it on startup, so restart the dev server after you change it.

Required for the admin page:

```bash
ADMIN_EMAILS=studio@example.com
ADMIN_PASSWORD=choose-a-long-password
ADMIN_SESSION_SECRET=choose-a-long-random-string
```

`ADMIN_EMAILS` can list more than one address, separated by commas. Five failed sign-ins lock that email for ten minutes. If these three values are missing, the admin page stays closed.

Optional integrations:

```bash
YOCO_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_CALCOM_API_URL=
```

A refund only calls Yoco when the booking has a checkout id and `YOCO_SECRET_KEY` is set. Otherwise the admin records the refund on the studio booking and is told that no card payment was attached.

## Where bookings are stored

Menu edits and bookings are written to `data/studio.json` on the machine running the app. That file is ignored by git because it can contain client names, emails, and phone numbers. A fresh checkout starts from the menu in `src/lib/servicesData.ts` and an empty booking list.

Hosts with a read-only filesystem, including default Vercel deployments, will not keep those edits after a restart.
