# 🚀 Quick Start Guide

## Your Cal.com integration is ready!

### What's Been Set Up

✅ 3 professionals with correct emails and passwords  
✅ 44 event types (11 services × 4 variants each)  
✅ Team structure (Bel Amour)  
✅ Availability schedules (Mon-Sat, 9 AM - 6 PM)  
✅ Frontend configuration synced with backend  

### Start Testing

#### 1. Start Cal.com Backend
```bash
cd cal-amour
yarn dev
```
Cal.com will run at: http://localhost:3000

#### 2. Start Bel Amour Frontend
```bash
cd bel-amour
npm run dev
```
Frontend will run at: http://localhost:3001

#### 3. Test a Booking

1. Go to http://localhost:3001
2. Click on a service (e.g., "Full Body Massage")
3. Choose "Any Professional" or select a specific one
4. Pick a time slot
5. Fill in your details
6. Complete the booking

#### 4. Verify in Cal.com

1. Go to http://localhost:3000
2. Login with: banele@belamour.co.za / BelAmour2026!
3. Check "Bookings" → "Upcoming"
4. Your test booking should appear

### Login Credentials

All professionals use the same password: `BelAmour2026!`

- banele@belamour.co.za
- dineo@belamour.co.za
- michelle@belamour.co.za

### How Bookings Work

**"Any Professional" bookings:**
- Uses team event types (IDs: 245-255)
- Cal.com assigns based on availability
- Round-robin distribution

**Specific professional bookings:**
- Uses individual event types
- Goes directly to chosen professional
- Example: Banele's Full Body Massage = Event ID 256

### Troubleshooting

**No slots available?**
- Availability is set to Mon-Sat, 9 AM - 6 PM
- Check you're looking at future dates
- Verify timezone is correct

**Booking fails?**
- Check Cal.com is running at localhost:3000
- Open browser console for error messages
- Verify API URL in .env.local

**Wrong professional assigned?**
- Check you selected the right option
- Team bookings auto-assign
- Individual bookings go to specific person

### Next Steps

1. ✅ Test the booking flow
2. Customize availability schedules per professional
3. Set up email notifications (optional)
4. Configure payment integration
5. Deploy to production

### Need Help?

Check these files:
- `INTEGRATION-COMPLETE.md` - Full documentation
- `CALCOM-SYNC-STATUS.md` - Technical details
- `cal-amour/scripts/verify-sync.sql` - Database verification

---

**Everything is ready to go! Start both servers and test your first booking.** 🎉
