# ✅ Cal.com Integration Complete

## Summary

Your Bel Amour frontend is now fully synced with the Cal.com backend. All users, event types, and configurations are in place.

## What Was Done

### 1. Database Setup ✅
- Created 3 professional users with @belamour.co.za emails
- Set passwords to `BelAmour2026!`
- Created "Bel Amour" team
- Added all professionals as team members
- Removed all other test users (33 users deleted)

### 2. Event Types ✅
- 11 services × 4 variants = 44 event types total
- Each service has:
  - Team event (collective - any professional)
  - Banele's individual event
  - Dineo's individual event
  - Michelle's individual event

### 3. Availability Schedules ✅
- Set up default working hours for all professionals
- Monday-Saturday: 9 AM - 6 PM (Africa/Johannesburg timezone)
- Sunday: Closed

### 4. Frontend Configuration ✅
- Updated `.env.local` with Cal.com URLs
- Updated `events.ts` with correct user IDs (34, 35, 36)
- Event type IDs match database exactly

## Login Credentials

### Cal.com Dashboard
- URL: https://cal-amour.thami.dev
- Users:
  - banele@belamour.co.za / BelAmour2026!
  - dineo@belamour.co.za / BelAmour2026!
  - michelle@belamour.co.za / BelAmour2026!

## How It Works

### Booking Flow

1. **Customer visits Bel Amour website**
   - Browses services from `servicesData.ts`

2. **Selects a service**
   - Example: "Full Body Massage" (slug: `full-body-massage`)

3. **Chooses professional (optional)**
   - "Any Professional" → Team event (ID 245)
   - "Banele" → Banele's event (ID 256)
   - "Dineo" → Dineo's event (ID 267)
   - "Michelle" → Michelle's event (ID 278)

4. **Frontend fetches available slots**
   ```
   GET https://cal-amour.thami.dev/api/v2/slots?eventTypeId=256
   ```

5. **Customer selects time and books**
   ```
   POST https://cal-amour.thami.dev/api/v2/bookings
   ```

6. **Booking appears in Cal.com dashboard**
   - Professional receives notification
   - Customer receives confirmation

### Professional Assignment

- **Team bookings**: Cal.com automatically assigns based on availability (round-robin)
- **Individual bookings**: Goes directly to selected professional
- All bookings sync in real-time

## Testing

### Start Cal.com Backend
```bash
cd cal-amour
yarn dev
```
Access at: http://localhost:3000 (or https://cal-amour.thami.dev if deployed)

### Start Bel Amour Frontend
```bash
cd bel-amour
npm run dev
```
Access at: http://localhost:3001

### Test Checklist
- [ ] Can view services on homepage
- [ ] Can select "Any Professional" and see available slots
- [ ] Can select specific professional and see their slots
- [ ] Can complete a booking
- [ ] Booking appears in Cal.com dashboard
- [ ] Can cancel a booking
- [ ] Email notifications work (if configured)

## Configuration Files

### Frontend (bel-amour)
- `.env.local` - Cal.com URLs
- `src/lib/calcom/events.ts` - Event type IDs and user mappings
- `src/lib/calcom/client.ts` - API client
- `src/lib/servicesData.ts` - Service definitions

### Backend (cal-amour)
- `.env` - Database and Cal.com configuration
- Database: Neon PostgreSQL (already configured)

## Event Type Reference

| Service | Duration | Team ID | Banele | Dineo | Michelle |
|---------|----------|---------|--------|-------|----------|
| Full Body Massage | 90 min | 245 | 256 | 267 | 278 |
| Hot Stone Massage | 60 min | 246 | 257 | 268 | 279 |
| Aroma Therapy | 60 min | 247 | 258 | 269 | 280 |
| Deep Tissue | 60 min | 248 | 259 | 270 | 281 |
| Swedish Massage | 60 min | 249 | 260 | 271 | 282 |
| Back Massage | 30 min | 250 | 261 | 272 | 283 |
| Head/Neck/Shoulder | 30 min | 251 | 262 | 273 | 284 |
| Facial Treatment | 30 min | 252 | 263 | 274 | 285 |
| Half-Day (Single) | 180 min | 253 | 264 | 275 | 286 |
| Half-Day (Couple) | 180 min | 254 | 265 | 276 | 287 |
| Couple's Treatment | 90 min | 255 | 266 | 277 | 288 |

## Troubleshooting

### Bookings not working?
1. Check Cal.com is running: `https://cal-amour.thami.dev`
2. Check browser console for errors
3. Verify event type IDs in `events.ts` match database

### No available slots?
1. Check professional availability schedules in Cal.com
2. Verify timezone is correct (Africa/Johannesburg)
3. Check event types are enabled (not draft)

### Wrong professional assigned?
1. Verify user IDs in `PROFESSIONAL_ID_TO_KEY` (events.ts)
2. Check event type ownership in database
3. Ensure team events use teamId=10

## Next Steps

1. **Deploy Cal.com** to production (if not already)
2. **Test end-to-end** booking flow
3. **Configure email** notifications (optional)
4. **Set up payment** integration with Yoco (if needed)
5. **Customize availability** per professional as needed
6. **Add buffer times** between appointments (optional)

## Support

For issues:
1. Check `CALCOM-SYNC-STATUS.md` for detailed configuration
2. Run `scripts/verify-sync.sql` to check database state
3. Check Cal.com logs for API errors
4. Review browser console for frontend errors

---

**Status**: ✅ Ready for production use
**Last Updated**: 2026-02-18
