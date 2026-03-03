# QR Code Attendance Tracking System

This document describes the QR code attendance tracking system implementation for the Student Management System.

## Overview

The system provides a secure, automated way to track student attendance using **permanent QR codes** unique to each student. Unlike temporary tokens, these QR codes remain valid throughout the student's enrollment and can be printed on ID cards or displayed digitally.

## QR Code Format

Each student's QR code encodes a simple, verifiable format:

```
STU:{userId}:SCHOOL2024
```

**Example:** For a student with ID 1:
```
STU:1:SCHOOL2024
```

### Format Breakdown:
- `STU:` - Prefix identifying this as a student QR code
- `{userId}` - The student's unique database ID
- `SCHOOL2024` - School identifier (prevents cross-school scanning)

## Database Schema

### Tables Created

1. **attendance_sessions** - Tracks attendance sessions created by teachers
   - `id` - Primary key
   - `session_name` - Name of the attendance session
   - `section_id` - Optional section/grade identifier
   - `created_by` - Teacher/admin who created the session
   - `created_at` - Timestamp of creation
   - `is_active` - Whether the session is active
   - `expires_at` - When the session expires

2. **attendance_records** - Stores individual attendance records
   - `id` - Primary key
   - `session_id` - Reference to attendance session
   - `user_id` - Student who attended
   - `student_name` - Student's name (denormalized for quick display)
   - `grade` - Student's grade (denormalized)
   - `scanned_at` - Timestamp of attendance
   - `scan_method` - 'qr_code' or 'manual'
   - `status` - 'present', 'late', or 'early'

## API Endpoints

### QR Code Scanning
- **POST** `/api/attendance/scan`
  - Body: `{ token, sessionId, deviceInfo? }`
  - Parses the permanent QR format `STU:{id}:SCHOOL2024`
  - Validates student exists
  - Records attendance
  - Returns success/duplicate status

### Session Management
- **GET** `/api/attendance/sessions`
  - Returns all active attendance sessions

- **POST** `/api/attendance/sessions`
  - Creates a new attendance session
  - Body: `{ sessionName, sectionId?, createdBy }`

- **GET** `/api/attendance/sessions/[id]`
  - Returns session details and all attendance records

- **DELETE** `/api/attendance/sessions/[id]`
  - Deactivates a session

### User Attendance History
- **GET** `/api/attendance/history?userId={id}`
  - Returns user's attendance records and statistics

## Advantages of Permanent QR Codes

1. **No Token Expiry** - QR codes work indefinitely
2. **Printable** - Can be printed on student ID cards
3. **Simple Verification** - Easy to validate the format
4. **Low Maintenance** - No need for token regeneration
5. **Offline Capable** - Works without real-time token validation

## Security Considerations

- The school identifier (`SCHOOL2024`) prevents unauthorized scanning from other schools
- Duplicate scan detection prevents students from checking in twice
- Session validation ensures attendance is only recorded during valid sessions
- All scans are timestamped and logged

## Frontend Implementation

### Student Profile Page
The student's profile page displays:
- A permanent QR code based on student ID
- Attendance statistics (present, late, early counts)
- Attendance rate percentage

### QR Code Display Format
```tsx
<QRCode
  value={`STU:${user.id}:SCHOOL2024`}
  size={200}
  level="H"
/>
```

## Database Setup

Run the SQL migration in Supabase SQL Editor:
```sql
-- File: supabase-migrations/001_create_attendance_tables.sql
```

This will create all required tables with proper indexes and foreign keys.

## Usage Flow

### For Students:
1. Log in to the student portal
2. Navigate to Profile
3. Click "Student QR Code" button
4. Show the QR code to the teacher (or present their ID card)

### For Teachers:
1. Log in to the teacher/admin portal
2. Navigate to QR Scanner Attendance
3. Create a new attendance session or select existing one
4. Scan student QR codes (using a QR scanner device or camera)
5. View real-time attendance list

## Status Determination

Attendance status is automatically determined based on scan time:
- **Early**: Before 8:00 AM
- **Present**: 8:00 AM - 10:00 AM
- **Late**: After 10:00 AM

## Error Handling

The system handles:
- Invalid QR code format
- Non-existent student IDs
- Duplicate scans (returns existing record)
- Session expiration
- Network errors

## Files Created

### Backend
- `lib/attendance-db.ts` - Database operations for attendance
- `app/api/attendance/scan/route.ts` - QR code scanning with permanent format
- `app/api/attendance/sessions/route.ts` - Session management
- `app/api/attendance/sessions/[id]/route.ts` - Session details
- `app/api/attendance/history/route.ts` - User attendance history

### Frontend
- `app/profile/page.tsx` - Updated with permanent QR code display
- `types/qrcode.react.d.ts` - TypeScript definitions

### Database
- `supabase-migrations/001_create_attendance_tables.sql` - Migration script

## Testing

1. Run the Supabase migration to create tables
2. Start the development server: `npm run dev`
3. Log in as a student and view the QR code
4. Log in as a teacher and create an attendance session
5. Test scanning the QR code (simulated in demo mode)
6. Verify duplicate scan handling

## Customization

To change the school identifier:
1. Update the QR code generation in `app/profile/page.tsx`
2. Update the pattern matching in `app/api/attendance/scan/route.ts`
3. Update the `QR_ATTENDANCE_SYSTEM.md` documentation

Example change from `SCHOOL2024` to `MYSCHOOL`:
```tsx
// Frontend
value={`STU:${user.id}:MYSCHOOL`}

// Backend regex
const qrPattern = /^STU:(\d+):MYSCHOOL$/
```
