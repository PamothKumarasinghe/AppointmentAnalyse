# Business Location Fields - Implementation Guide

## Overview

Added business location fields to enable users to find and search for admins (doctors/providers) by business name, city, state, and location.

## Database Changes

### New Fields Added to `users` Table:

- `business_name` - Business or clinic name
- `address` - Street address
- `city` - City
- `state` - State/Province
- `zip_code` - ZIP/Postal code
- `country` - Country (defaults to 'USA')

### Indexes Created:

- `idx_users_city` - For faster city searches
- `idx_users_state` - For faster state searches
- `idx_users_business_name` - For faster business name searches

## API Changes

### 1. Signup Endpoint (`POST /api/auth/signup`)

**For Admin Users - Required Fields:**

- `email`
- `password`
- `role` (must be "admin")
- `business_name` ⭐ NEW - Required for admins
- `city` ⭐ NEW - Required for admins

**Additional Optional Fields:**

- `full_name`
- `specialty`
- `phone`
- `address`
- `state`
- `zip_code`
- `country`

**Example Admin Signup:**

```json
{
  "email": "doctor@clinic.com",
  "password": "SecurePass123!",
  "role": "admin",
  "full_name": "Dr. Sarah Johnson",
  "specialty": "Cardiologist",
  "business_name": "Heart Care Medical Center",
  "address": "123 Main Street",
  "city": "New York",
  "state": "NY",
  "zip_code": "10001",
  "country": "USA",
  "phone": "+1234567890"
}
```

### 2. Admin Search Endpoint (`GET /api/admins`)

**New Query Parameters:**

- `search` - Search by name, business name, OR specialty
- `city` - Filter by city
- `state` - Filter by state
- `specialty` - Filter by specialty

**Examples:**

```
GET /api/admins?city=New York
GET /api/admins?state=NY&specialty=Cardiologist
GET /api/admins?search=Heart Care
```

### 3. Profile Endpoints

- `GET /api/auth/profile` - Now returns all business fields
- `PUT /api/auth/profile` - Can update any business field
- `GET /api/admins/:adminId` - Returns full admin profile with location

## Migration Instructions

### For New Installations:

Run the full schema:

```bash
supabase-schema.sql
```

### For Existing Databases:

Run the migration file:

```bash
add-business-fields-migration.sql
```

This will:

- Add the new columns to your existing `users` table
- Create indexes for better search performance
- Preserve all existing data

## Frontend Updates

### Type Definitions (`types.ts`)

The `User` interface now includes:

```typescript
interface User {
  // ... existing fields
  business_name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  phone?: string;
}
```

## Use Cases

### 1. User Finding a Doctor by Location

```
GET /api/admins?city=Los Angeles&specialty=Dentist
```

### 2. User Searching for a Specific Clinic

```
GET /api/admins?search=Care Medical Center
```

### 3. User Browsing Local Providers

```
GET /api/admins?state=CA
```

## Benefits

✅ **Better Search** - Users can find providers by location  
✅ **Professional Listings** - Admins can display business information  
✅ **Location-Based Filtering** - Easy to find nearby providers  
✅ **Business Identity** - Clear identification of clinics/practices  
✅ **Scalability** - Ready for map integration and distance-based search

## Next Steps (Optional Enhancements)

1. **Map Integration** - Add Google Maps/MapBox to show admin locations
2. **Distance Search** - Calculate distance from user's location
3. **Business Hours** - Add operating hours to admin profiles
4. **Photos** - Allow admins to upload clinic photos
5. **Reviews** - Add user reviews for admins/clinics

## Notes

- Business fields are **required** for admin signup to ensure complete listings
- Regular users don't need these fields
- All existing admins should update their profiles to add business information
- Search is case-insensitive and supports partial matches
