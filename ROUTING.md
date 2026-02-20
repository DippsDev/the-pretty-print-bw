# Bel Amour Routing Structure

## Routes

The application now uses Next.js App Router with the following routes:

### Main Routes

- **`/`** - Home page with hero section and "Book Now" button
- **`/book`** - Full booking flow (services, professionals, time selection, confirmation)
- **`/contact`** - Contact form page

### Navigation

The navbar provides access to:
- Services menu (opens booking flow at `/book`)
- Contact page (navigates to `/contact`)

## Mobile Responsiveness

All pages are fully responsive with:

- **Mobile-first design** with breakpoints at `sm:` (640px), `md:` (768px), `lg:` (1024px)
- **Bottom sheet** on mobile for booking summary (hidden on desktop)
- **Sticky sidebar** on desktop for booking summary
- **Responsive typography** that scales appropriately
- **Touch-friendly** buttons and interactive elements
- **Safe area insets** for notched devices

## Key Features

### Home Page (`/`)
- Clean hero section with tagline
- Prominent "Book Now" CTA button
- Responsive text sizing

### Booking Page (`/book`)
- Multi-step booking flow:
  1. Service selection
  2. Professional selection
  3. Time selection
  4. Confirmation
- Progress tracker
- Mobile bottom sheet with booking summary
- Desktop sidebar with full booking details

### Contact Page (`/contact`)
- Two-column layout (stacks on mobile)
- Contact form with validation
- Business hours information

## Development

To run the development server:

```bash
npm run dev
```

Visit:
- Home: http://localhost:3000
- Booking: http://localhost:3000/book
- Contact: http://localhost:3000/contact
