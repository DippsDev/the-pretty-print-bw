# Cal.com Integration Sync Status

## ✅ Database Setup Complete

### Users
- **banele** (ID: 34) - banele@belamour.co.za
- **dineo** (ID: 35) - dineo@belamour.co.za  
- **michelle** (ID: 36) - michelle@belamour.co.za

All users have password: `BelAmour2026!`

### Team
- **Bel Amour** (ID: 10) - slug: `bel-amour`
- All three professionals are members

## ✅ Event Types Created

Each service has 4 event types:
1. Team event (collective booking - any professional)
2. Banele's individual event
3. Dineo's individual event
4. Michelle's individual event

### Event Type IDs by Service

| Service | Team (ID 10) | Banele (ID 34) | Dineo (ID 35) | Michelle (ID 36) |
|---------|--------------|----------------|---------------|------------------|
| full-body-massage | 245 | 256 | 267 | 278 |
| hot-stone-massage | 246 | 257 | 268 | 279 |
| aroma-therapy | 247 | 258 | 269 | 280 |
| deep-tissue-massage | 248 | 259 | 270 | 281 |
| swedish-massage | 249 | 260 | 271 | 282 |
| back-massage | 250 | 261 | 272 | 283 |
| head-neck-shoulder-massage | 251 | 262 | 273 | 284 |
| facial-treatment | 252 | 263 | 274 | 285 |
| half-day-package-single | 253 | 264 | 275 | 286 |
| half-day-package-couple | 254 | 265 | 276 | 287 |
| couples-treatment | 255 | 266 | 277 | 288 |

## ✅ Frontend Configuration

### Environment Variables (.env.local)
```
NEXT_PUBLIC_CALCOM_API_URL="https://cal-amour.thami.dev/api"
NEXT_PUBLIC_CALCOM_WEBAPP_URL="https://cal-amour.thami.dev"
```

### Professional ID Mapping (events.ts)
```typescript
PROFESSIONAL_ID_TO_KEY: {
  0: 'team',
  34: 'banele',
  35: 'dineo',
  36: 'michelle',
}
```

## 🔄 How Booking Flow Works

### 1. User Selects Service
Frontend shows services from `servicesData.ts` with slugs like `full-body-massage`

### 2. User Selects Professional (Optional)
- "Any Professional" → Uses team event type (ID 10)
- "Banele" → Uses Banele's event type (ID 34)
- "Dineo" → Uses Dineo's event type (ID 35)
- "Michelle" → Uses Michelle's event type (ID 36)

### 3. Frontend Resolves Event Type ID
`events.ts` maps: `(serviceSlug, professionalKey) → eventTypeId`

Example:
- Service: `full-body-massage`
- Professional: `banele`
- Result: Event Type ID `256`

### 4. Fetch Available Slots
```typescript
GET /api/v2/slots?eventTypeId=256&start=2026-02-19&end=2026-02-26
```

### 5. Create Booking
```typescript
POST /api/v2/bookings
{
  eventTypeId: 256,
  start: "2026-02-20T10:00:00Z",
  lengthInMinutes: 90,
  attendee: { name, email, timeZone }
}
```

## ✅ What's Working

1. ✅ Database has correct users with proper emails
2. ✅ All event types exist with correct slugs and durations
3. ✅ Team structure is set up (Bel Amour team)
4. ✅ Frontend has correct API URLs configured
5. ✅ Professional ID mapping updated to match database IDs

## 📝 Testing Checklist

- [ ] Start Cal.com instance: `cd cal-amour && yarn dev`
- [ ] Start frontend: `cd bel-amour && npm run dev`
- [ ] Test "Any Professional" booking flow
- [ ] Test booking with specific professional (Banele)
- [ ] Test booking with specific professional (Dineo)
- [ ] Test booking with specific professional (Michelle)
- [ ] Verify booking appears in Cal.com dashboard
- [ ] Test booking cancellation

## 🚀 Next Steps

1. Ensure Cal.com is deployed and accessible at `https://cal-amour.thami.dev`
2. Test the booking flow end-to-end
3. Configure availability schedules for each professional
4. Set up email notifications (optional)
5. Configure payment integration if needed

## 🔧 Troubleshooting

### If bookings fail:
1. Check Cal.com is running: `https://cal-amour.thami.dev`
2. Verify API is accessible: `https://cal-amour.thami.dev/api/health`
3. Check browser console for errors
4. Verify event type IDs match in database and frontend

### If wrong professional is assigned:
1. Check `PROFESSIONAL_ID_TO_KEY` mapping in `events.ts`
2. Verify user IDs in database match frontend configuration
3. Check event type ownership in database

### If slots don't appear:
1. Verify professionals have availability schedules set
2. Check event type is enabled (not in draft mode)
3. Verify timezone handling is correct
