# Professional Selection Fix - Mobile Bottom Sheet

## Issue
When selecting a professional from the mobile bottom sheet, the selection wasn't updating properly in the UI.

## Root Cause
The `handleOpenProfessionalModal` function was opening the wrong modal type when clicking from the mobile sheet. When there were multiple bookings, it would open the "per-service" modal (showing all services) instead of opening the single professional selection modal for the specific service that was clicked.

## Solution

### 1. Fixed Modal Opening Logic
Updated `handleOpenProfessionalModal` to:
- When an index is provided (clicked from mobile sheet), open the single professional modal for THAT specific service
- Set the `activeProfessionalIdx` to track which service is being edited
- Automatically switch to `perService` mode if multiple bookings exist

```typescript
function handleOpenProfessionalModal(idx?: number) {
  if (typeof idx === "number") {
    setActiveProfessionalIdx(idx);
    if (bookings.length > 1 && professionalMode !== 'perService') {
      setProfessionalMode('perService');
    }
    setProfessionalModalOpen(true);
  } else if (bookings.length > 1) {
    setPerServiceModalOpen(true);
    setActiveProfessionalIdx(null);
  } else {
    setActiveProfessionalIdx(null);
    setProfessionalModalOpen(true);
  }
}
```

### 2. Added Force Re-render Key
Added a dynamic key to the mobile bottom sheet that includes:
- Number of bookings
- Current professional selections (stringified)

This ensures the component re-renders when professional selections change:

```typescript
key={`mobile-sheet-${bookings.length}-${JSON.stringify(selectedProfessionals)}`}
```

### 3. Improved UX
- Professional names are now clickable buttons with visual indicators
- Added person icon and dropdown arrow
- Underlined text to indicate interactivity
- Hover effects for better feedback
- Helper text: "Tap professional name to change"

## How It Works Now

1. User taps on a professional name in the mobile bottom sheet
2. `handleOpenProfessionalModal(i)` is called with the booking index
3. The function sets `activeProfessionalIdx = i` and opens the professional modal
4. User selects a new professional
5. Redux state is updated via `setSelectedProfessionals({ bookingIdx: i, id })`
6. Mobile sheet re-renders with the new key, showing updated professional name

## Testing

To test the fix:
1. Add multiple services to your booking
2. Open the mobile bottom sheet (expand it)
3. Tap on any professional name
4. Select a different professional
5. Verify the name updates immediately in the mobile sheet
6. Repeat for other services to ensure each can be changed independently

## Related Files
- `bel-amour/src/app/pages/ServicesPage.tsx` - Main booking page with modal logic
- `bel-amour/src/redux/professionalSlice.ts` - Redux state management
- `bel-amour/src/components/modals/ProfessionalSelection.tsx` - Professional selection modal
