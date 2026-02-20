# Starting Cal.com Services

Your Bel Amour frontend needs TWO Cal.com services running:

## 1. Start Cal.com API v2 (Port 5555)

This handles bookings and availability.

```bash
cd cal-amour
yarn dev:api
```

This will start:
- Main web app on port 3000
- API v2 on port 5555

## 2. Start Bel Amour Frontend (Port 3001)

In a new terminal:

```bash
cd bel-amour
npm run dev
```

## Verify Services Are Running

- Cal.com Web: http://localhost:3000
- Cal.com API v2: http://localhost:5555
- Bel Amour: http://localhost:3001

## Test the Integration

1. Go to http://localhost:3001
2. Select a service (e.g., "Swedish Massage")
3. Choose a professional
4. You should see available time slots
5. Complete a booking

## Troubleshooting

### "Failed to fetch slots" error?
- Make sure API v2 is running on port 5555
- Check: `curl http://localhost:5555/health`

### No slots available?
- Professionals have availability Mon-Sat, 9 AM - 6 PM
- Try selecting tomorrow's date
- Check timezone is correct

### API v2 won't start?
- Make sure Redis is accessible (configured in .env)
- Check database connection
- Run: `yarn workspace @calcom/prisma prisma generate`

## Quick Start (All in One)

```bash
# Terminal 1: Start Cal.com with API
cd cal-amour && yarn dev:api

# Terminal 2: Start Bel Amour
cd bel-amour && npm run dev
```

Then visit: http://localhost:3001
