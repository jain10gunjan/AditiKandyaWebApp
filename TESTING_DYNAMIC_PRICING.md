# Testing Dynamic Pricing Feature

## Prerequisites
1. Make sure backend server is running (`npm start` in `music-school-backend`)
2. Make sure frontend is running (`npm run dev` in `music-school-frontend`)
3. You need admin access (email: themusinest@gmail.com)

## Step-by-Step Testing Guide

### 1. Access Admin Panel
1. Navigate to `http://localhost:5173/admin`
2. Sign in with admin account
3. You should see "Dynamic Pricing" card in Quick Actions section

### 2. Create Dynamic Pricing

#### For US Region:
1. Click on "Dynamic Pricing" in Quick Actions
2. Find a course and click "Add Pricing"
3. Fill the form:
   - **Region**: Select "United States"
   - **Currency**: Should auto-select "USD"
   - **Price**: Enter `99` (or any amount)
   - **Country Code**: Should be "US"
4. Click "Create Pricing"

#### For India Region:
1. Click "Add Pricing" on the same course
2. Fill the form:
   - **Region**: Select "India"
   - **Currency**: Should auto-select "INR"
   - **Price**: Enter `2999` (or any amount)
   - **Country Code**: Should be "IN"
3. Click "Create Pricing"

### 3. Test Frontend Display

#### Test on Courses Page:
1. Navigate to `http://localhost:5173/courses`
2. Check the course card - price badge should show region-specific price
3. For US users: Should show `$99` (or your US price)
4. For India users: Should show `₹2999` (or your India price)

#### Test on Course Detail Page:
1. Click on a course to view details
2. Check the pricing card in the sidebar
3. Price should match your region

### 4. Test Different Regions

#### Method 1: Change Browser Timezone (Chrome)
1. Open Chrome DevTools (F12)
2. Press `Ctrl+Shift+P` (Cmd+Shift+P on Mac)
3. Type "Show Sensors" and select it
4. In the Sensors tab, change "Location" to a different country
5. Or change "Timezone" to a different timezone
6. Refresh the page

#### Method 2: Test via Browser Console
Open browser console and run:
```javascript
// Simulate US region
localStorage.setItem('testRegion', 'US')
// Then refresh page

// Simulate India region  
localStorage.setItem('testRegion', 'IN')
// Then refresh page
```

#### Method 3: Test API Directly
Open browser console and test:
```javascript
// Test US pricing
fetch('http://localhost:4000/api/courses/YOUR_COURSE_ID/pricing/US')
  .then(r => r.json())
  .then(console.log)

// Test India pricing
fetch('http://localhost:4000/api/courses/YOUR_COURSE_ID/pricing/IN')
  .then(r => r.json())
  .then(console.log)
```

### 5. Verify Admin Management

#### Edit Pricing:
1. Go to `/admin/dynamic-pricing`
2. Find a pricing entry
3. Click "Edit"
4. Change the price
5. Click "Update Pricing"
6. Verify the change on frontend

#### Delete Pricing:
1. Click "Delete" on a pricing entry
2. Confirm deletion
3. Frontend should fallback to default course price

### 6. Test Edge Cases

#### No Pricing Set:
1. Create a course without any dynamic pricing
2. Frontend should show default course price (₹ format)

#### Multiple Regions:
1. Set pricing for US, IN, EU on same course
2. Test each region - should show correct price

#### Inactive Pricing:
1. Create pricing and uncheck "Active"
2. Frontend should not use it (fallback to default)

## Expected Behavior

### For US Users:
- Timezone: America/New_York, America/Los_Angeles, etc.
- Country: US
- Region: US
- Currency: USD
- Price Format: `$99`

### For India Users:
- Timezone: Asia/Kolkata, Asia/Mumbai, etc.
- Country: IN
- Region: IN
- Currency: INR
- Price Format: `₹2999`

### For Other Regions:
- Falls back to default course price
- Currency: INR (₹)

## Troubleshooting

### Price not updating:
1. Check browser console for errors
2. Verify pricing is created in admin panel
3. Check if pricing is marked as "Active"
4. Clear browser cache and refresh

### Wrong region detected:
1. Check browser timezone settings
2. Verify timezone detection in console:
   ```javascript
   Intl.DateTimeFormat().resolvedOptions().timeZone
   ```

### API errors:
1. Check backend server is running
2. Verify MongoDB connection
3. Check server logs for errors

## Quick Test Checklist

- [ ] Can access `/admin/dynamic-pricing`
- [ ] Can create pricing for US region
- [ ] Can create pricing for IN region
- [ ] Can edit existing pricing
- [ ] Can delete pricing
- [ ] Course cards show correct price
- [ ] Course detail page shows correct price
- [ ] Different regions show different prices
- [ ] Fallback to default price works
- [ ] Currency symbols display correctly

