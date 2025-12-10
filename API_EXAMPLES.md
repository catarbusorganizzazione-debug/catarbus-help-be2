# Catarbus Help Backend API Testing

This file contains example requests to test the MongoDB-powered API endpoints with authentication.

## Prerequisites
Make sure MongoDB is running and the server is started with `npm start` or `npm run dev`.

## Base URL
```
http://localhost:3001
```

## Authentication Endpoints

### 1. Register a new user with SHA256 password
```bash
# First, create a SHA256 hash of your password
# Example: password "mypassword123" -> SHA256 hash

curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mario Rossi",
    "email": "mario.rossi@email.com",
    "password": "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f"
  }'
```

### 2. User login with SHA256 password
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mario.rossi@email.com",
    "password": "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f"
  }'
```

### 3. Change user password
```bash
curl -X POST http://localhost:3001/auth/change-password \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "65a1b2c3d4e5f6789abcdef0",
    "oldPassword": "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f",
    "newPassword": "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3"
  }'
```

### 4. Reset user password (admin)
```bash
curl -X POST http://localhost:3001/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "65a1b2c3d4e5f6789abcdef0",
    "newPassword": "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3"
  }'
```

### 5. Get authentication statistics
```bash
curl -X GET http://localhost:3001/auth/stats
```

## Appointment Endpoints

### 1. Create a new appointment
```bash
curl -X POST http://localhost:3001/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "65a1b2c3d4e5f6789abcdef0",
    "title": "Consulenza tecnica",
    "description": "Consulenza per problemi di connettività",
    "date": "2024-12-15",
    "time": "10:30",
    "duration": 60,
    "status": "scheduled",
    "notes": "Cliente ha problemi con la linea internet"
  }'
```

### 2. Get all appointments
```bash
# Get all appointments (with pagination)
curl -X GET http://localhost:3001/appointments

# Filter by status
curl -X GET "http://localhost:3001/appointments?status=scheduled"

# Filter by date
curl -X GET "http://localhost:3001/appointments?date=2024-12-15"

# Pagination
curl -X GET "http://localhost:3001/appointments?page=2&limit=5"
```

### 3. Get appointment by ID
```bash
# Replace {appointment_id} with actual MongoDB ObjectId
curl -X GET http://localhost:3001/appointments/{appointment_id}
```

### 4. Get appointments by user ID
```bash
# Replace {user_id} with actual MongoDB ObjectId
curl -X GET http://localhost:3001/appointments/user/{user_id}

# With pagination
curl -X GET "http://localhost:3001/appointments/user/{user_id}?page=1&limit=10"
```

### 5. Get appointments by date range
```bash
# Get appointments between two dates
curl -X GET http://localhost:3001/appointments/date/2024-12-01/2024-12-31

# With pagination
curl -X GET "http://localhost:3001/appointments/date/2024-12-01/2024-12-31?page=1&limit=20"
```

### 6. Update appointment
```bash
# Replace {appointment_id} with actual MongoDB ObjectId
curl -X PUT http://localhost:3001/appointments/{appointment_id} \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Consulenza tecnica aggiornata",
    "status": "confirmed",
    "notes": "Cliente confermato per appuntamento"
  }'
```

### 7. Get appointment statistics
```bash
curl -X GET http://localhost:3001/appointments/stats
```

### 8. Delete appointment
```bash
# Replace {appointment_id} with actual MongoDB ObjectId
curl -X DELETE http://localhost:3001/appointments/{appointment_id}
```

## SHA256 Password Examples

For testing, here are some common passwords and their SHA256 hashes:

- `password123` -> `ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f`
- `hello` -> `2cf24dba4f21d4288094a5a75fc3b14481e2d20b2bb3d9b35bb1cd85f8a27ae3`
- `test1234` -> `a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3`

You can generate SHA256 hashes using:
- Online tools: https://emn178.github.io/online-tools/sha256.html
- PowerShell: `(Get-FileHash -Algorithm SHA256 -InputStream ([IO.MemoryStream]::new([Text.Encoding]::UTF8.GetBytes("yourpassword")))).Hash.ToLower()`
- Node.js: `require('crypto').createHash('sha256').update('yourpassword').digest('hex')`

### 1. Get API Documentation
```bash
curl -X GET http://localhost:3001/
```

### 2. Create a new user (without password - for basic user management)
```bash
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Giulia Bianchi",
    "email": "giulia.bianchi@email.com"
  }'
```

### 3. Get all users (with pagination)
```bash
# Get first page (default)
curl -X GET http://localhost:3001/users

# Get second page with custom limit
curl -X GET "http://localhost:3001/users?page=2&limit=5"

# Filter by status
curl -X GET "http://localhost:3001/users?status=active"
```

### 4. Get user by ID
```bash
# Replace {user_id} with actual MongoDB ObjectId
curl -X GET http://localhost:3001/users/{user_id}
```

### 5. Update user
```bash
# Replace {user_id} with actual MongoDB ObjectId
curl -X PUT http://localhost:3001/users/{user_id} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mario Rossi Updated",
    "email": "mario.updated@email.com"
  }'
```

### 6. Search users
```bash
# Search by name or email
curl -X GET http://localhost:3001/users/search/mario

# Search with pagination
curl -X GET "http://localhost:3001/users/search/bianchi?page=1&limit=5"
```

### 7. Get user statistics
```bash
curl -X GET http://localhost:3001/users/stats
```

### 8. Delete user
```bash
# Replace {user_id} with actual MongoDB ObjectId
curl -X DELETE http://localhost:3001/users/{user_id}
```

## Example Responses

### Appointment Creation Success Response
```json
{
  "_id": "65a1b2c3d4e5f6789abcdef1",
  "title": "Consulenza tecnica",
  "description": "Consulenza per problemi di connettività",
  "date": "2024-12-15",
  "time": "10:30",
  "duration": 60,
  "status": "scheduled",
  "notes": "Cliente ha problemi con la linea internet",
  "createdAt": "2023-12-08T10:30:45.123Z",
  "updatedAt": "2023-12-08T10:30:45.123Z",
  "user": {
    "_id": "65a1b2c3d4e5f6789abcdef0",
    "name": "Mario Rossi",
    "email": "mario.rossi@email.com"
  }
}
```

### Appointments List Response
```json
{
  "appointments": [
    {
      "_id": "65a1b2c3d4e5f6789abcdef1",
      "title": "Consulenza tecnica",
      "description": "Consulenza per problemi di connettività",
      "date": "2024-12-15",
      "time": "10:30",
      "duration": 60,
      "status": "scheduled",
      "notes": "Cliente ha problemi con la linea internet",
      "createdAt": "2023-12-08T10:30:45.123Z",
      "updatedAt": "2023-12-08T10:30:45.123Z",
      "user": {
        "_id": "65a1b2c3d4e5f6789abcdef0",
        "name": "Mario Rossi",
        "email": "mario.rossi@email.com"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalAppointments": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

### Appointment Statistics Response
```json
{
  "totalAppointments": 25,
  "scheduledAppointments": 10,
  "confirmedAppointments": 8,
  "completedAppointments": 5,
  "cancelledAppointments": 2,
  "todayAppointments": 3,
  "upcomingAppointments": 12
}
```

### Users List with Pagination Response
```json
{
  "users": [
    {
      "_id": "65a1b2c3d4e5f6789abcdef0",
      "name": "Mario Rossi",
      "email": "mario.rossi@email.com",
      "status": "active",
      "createdAt": "2023-12-08T10:30:45.123Z",
      "updatedAt": "2023-12-08T10:30:45.123Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalUsers": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

### Error Response
```json
{
  "error": "Validation failed: Name is required and must be at least 2 characters long"
}
```

## PowerShell Examples (Windows)

### Register User
```powershell
$body = @{
    name = "Marco Verdi"
    email = "marco.verdi@email.com"
    password = "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f"  # SHA256 of "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/auth/register" -Method POST -Body $body -ContentType "application/json"
```

### Login User
```powershell
$loginBody = @{
    email = "marco.verdi@email.com"
    password = "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
```

### Generate SHA256 Hash in PowerShell
```powershell
function Get-SHA256Hash($inputString) {
    $hasher = [System.Security.Cryptography.SHA256]::Create()
    $hash = $hasher.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($inputString))
    $hashString = [System.BitConverter]::ToString($hash) -replace '-'
    return $hashString.ToLower()
}

# Example usage
Get-SHA256Hash "mypassword"
```

### Create Appointment
```powershell
$appointmentBody = @{
    userId = "65a1b2c3d4e5f6789abcdef0"  # Replace with actual user ID
    title = "Consulenza IT"
    description = "Supporto tecnico per configurazione rete"
    date = "2024-12-15"
    time = "14:30"
    duration = 45
    status = "scheduled"
    notes = "Cliente preferisce chiamata telefonica"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/appointments" -Method POST -Body $appointmentBody -ContentType "application/json"
```

### Get User Appointments
```powershell
# Replace with actual user ID
$userId = "65a1b2c3d4e5f6789abcdef0"
Invoke-RestMethod -Uri "http://localhost:3001/appointments/user/$userId" -Method GET
```

### Get Appointments by Date Range
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/appointments/date/2024-12-01/2024-12-31" -Method GET
```

## Notes

1. **MongoDB ObjectId**: User and Appointment IDs are MongoDB ObjectIds (24 character hex strings)
2. **Date Format**: Dates must be in YYYY-MM-DD format
3. **Time Format**: Times must be in HH:MM format (24-hour)
4. **Appointment Validation**: 
   - Title minimum 3 characters
   - Valid userId required
   - No scheduling conflicts for same user at same date/time
5. **Status Values**: scheduled, confirmed, completed, cancelled
6. **Duration**: In minutes (default: 30)
7. **Pagination**: Default page size is 10, can be customized with `limit` parameter
8. **Timestamps**: `createdAt` and `updatedAt` are automatically managed
9. **User Lookup**: Appointment responses include user information via MongoDB aggregation