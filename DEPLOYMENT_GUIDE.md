# Deployment Guide - Lyrcon Replica

This guide explains how to deploy code changes to production or a new server.

---

## Quick Summary

**Database Changes:** ✅ None required - all fields already exist  
**Code Changes:** Backend + Frontend files modified  
**Optional Database Fix:** Allow NULL for `running_km` field (see below)

---

## Step-by-Step Deployment Process

### 1. **Prepare Your Code**

Make sure all changes are committed to Git:

```bash
# Check what files changed
git status

# Add all changes
git add .

# Commit with a descriptive message
git commit -m "Fixed sell car functionality, edit navigation, and validation"

# Push to your repository
git push origin main
```

---

### 2. **Deploy to Server**

#### **Option A: If using Git on server**

```bash
# SSH into your server
ssh your-server

# Navigate to project directory
cd /path/to/lyrcon-replica

# Pull latest changes
git pull origin main

# Restart backend
# (Stop the current process with Ctrl+C, then restart)
python backend/app.py

# Restart frontend (if running separately)
# Navigate to frontend and rebuild
npm run build
```

#### **Option B: If manually uploading files**

Upload these modified files to your server:

**Backend:**
- `backend/app.py`

**Frontend:**
- `src/App.jsx`
- `src/pages/Inventory.jsx`
- `src/pages/AddCar.jsx`

Then restart your backend server.

---

### 3. **Optional Database Update**

If you want to allow `running_km` to be NULL (recommended for consistency):

```bash
# Connect to PostgreSQL
psql -U your_username -d your_database_name

# Run this command
ALTER TABLE vehicle ALTER COLUMN running_km DROP NOT NULL;

# Exit
\q
```

**Note:** This is optional - the code already handles the NOT NULL constraint by setting `running_km` to `0.0` when empty.

---

### 4. **Verify Deployment**

After deploying, test these features:

- ✅ Add New Car
- ✅ Purchase Old Car  
- ✅ Sell Old Car (with auto-fill from inventory)
- ✅ Edit button on inventory (should go to correct form)
- ✅ Form validation (required fields)

---

## Files Modified in This Update

### Backend (`backend/app.py`)
- Fixed date parsing to handle empty strings safely
- Fixed numeric field handling for `running_km` NOT NULL constraint
- Added auto-update of vehicle status to "Sold" when transaction_type is "Sale"
- Improved error logging and JSON response handling

### Frontend

**`src/App.jsx`**
- Removed old generic edit route `/inventory/:id/edit`
- Added transaction-specific routes:
  - `/inventory/:id/edit-new`
  - `/inventory/:id/edit-purchase`
  - `/inventory/:id/edit-sale`

**`src/pages/Inventory.jsx`**
- Updated Edit button to navigate based on vehicle's `transaction_type`

**`src/pages/AddCar.jsx`**
- Fixed validation to make `docket_number` optional for non-New cars
- Fixed auto-fill to preserve customer data when selecting vehicle for sale
- Added validation debugging logs
- Fixed date formatting for form inputs

---

## Troubleshooting

### Backend won't start
- Check if port 5000 is already in use
- Verify PostgreSQL is running
- Check database connection string in environment variables

### 500 errors when saving
- Check backend console for detailed error messages
- Verify all required fields are filled in the form
- Check database constraints

### Edit button not working
- Clear browser cache
- Check browser console for errors
- Verify frontend build is up to date

---

## Environment Variables

Make sure these are set on your server:

```bash
DATABASE_URL=postgresql://username:password@localhost/dbname
SECRET_KEY=your-secret-key-here
FLASK_ENV=production  # or development
```

---

## Contact

If you encounter issues during deployment, check:
1. Backend console logs for errors
2. Browser console for frontend errors
3. Database connection status
4. File permissions on server

---

**Last Updated:** January 13, 2026  
**Version:** 1.0
