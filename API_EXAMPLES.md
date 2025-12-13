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

## Checkpoint Endpoints

The checkpoint system uses a simplified structure with the following fields:
- `internalId`: string (required, unique identifier)
- `location`: string (required, checkpoint location)
- `description`: string (optional, checkpoint description)
- `isMajorCheckpoint`: boolean (required, whether it's a major checkpoint)
- `result`: object (optional, with `message` string and `data` any type)

### 1. Create a new checkpoint
```bash
curl -X POST http://localhost:3001/checkpoints \
  -H "Content-Type: application/json" \
  -d '{
    "internalId": "CHK001",
    "location": "Server Room A - Rack 3",
    "description": "Network connectivity monitoring point",
    "isMajorCheckpoint": true,
    "result": {
      "message": "All systems operational",
      "data": {
        "status": "green",
        "uptime": "99.9%"
      }
    }
  }'
```

### 2. Get all checkpoints
```bash
# Get all checkpoints (with pagination)
curl -X GET http://localhost:3001/checkpoints

# Filter by location (partial match)
curl -X GET "http://localhost:3001/checkpoints?location=server"

# Filter by major checkpoints only
curl -X GET "http://localhost:3001/checkpoints?isMajorCheckpoint=true"

# Pagination
curl -X GET "http://localhost:3001/checkpoints?page=2&limit=5"
```

### 3. Get checkpoint by ID
```bash
# Replace {checkpoint_id} with actual MongoDB ObjectId
curl -X GET http://localhost:3001/checkpoints/{checkpoint_id}
```

### 4. Get checkpoints by internal ID (partial search)
```bash
# Search for checkpoints by internal ID
curl -X GET http://localhost:3001/checkpoints/internalId/CHK

# With pagination
curl -X GET "http://localhost:3001/checkpoints/internalId/CHK?page=1&limit=10"
```

### 5. Get major checkpoints only
```bash
# Get all major checkpoints
curl -X GET http://localhost:3001/checkpoints/major

# With pagination
curl -X GET "http://localhost:3001/checkpoints/major?page=1&limit=20"
```

### 6. Search checkpoints by location
```bash
# Search for checkpoints in server rooms
curl -X GET http://localhost:3001/checkpoints/location/server

# Search for rack-related checkpoints
curl -X GET "http://localhost:3001/checkpoints/location/rack?page=1&limit=10"
```

### 7. Update checkpoint
```bash
# Replace {checkpoint_id} with actual MongoDB ObjectId
curl -X PUT http://localhost:3001/checkpoints/{checkpoint_id} \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Data Center B - Rack 7",
    "description": "Updated monitoring point for network switches",
    "isMajorCheckpoint": false,
    "result": {
      "message": "Maintenance completed successfully",
      "data": {
        "maintenanceId": "MAINT-2024-001",
        "completedAt": "2024-01-15T10:30:00Z"
      }
    }
  }'
```

### 8. Update checkpoint result only
```bash
# Replace {checkpoint_id} with actual MongoDB ObjectId
curl -X PUT http://localhost:3001/checkpoints/{checkpoint_id}/result \
  -H "Content-Type: application/json" \
  -d '{
    "result": {
      "message": "System check completed",
      "data": {
        "checkTime": "2024-01-15T14:30:00Z",
        "status": "operational",
        "metrics": {
          "cpu": "45%",
          "memory": "67%",
          "disk": "23%"
        }
      }
    }
  }'
```

### 9. Get checkpoint statistics
```bash
curl -X GET http://localhost:3001/checkpoints/stats
```

### 10. Get dashboard data
```bash
curl -X GET http://localhost:3001/checkpoints/dashboard
```

### 11. Delete checkpoint
```bash
# Replace {checkpoint_id} with actual MongoDB ObjectId
curl -X DELETE http://localhost:3001/checkpoints/{checkpoint_id}
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

### Checkpoint Statistics Response
```json
{
  "totalCheckpoints": 45,
  "statusDistribution": {
    "active": 32,
    "inactive": 5,
    "error": 3,
    "maintenance": 5
  },
  "priorityDistribution": {
    "critical": 8,
    "high": 15,
    "normal": 22,
    "low": 0
  },
  "pendingChecks": 7,
  "recentlyChecked": 25
}
```

### Dashboard Data Response
```json
{
  "stats": {
    "totalCheckpoints": 45,
    "statusDistribution": {
      "active": 32,
      "inactive": 5,
      "error": 3,
      "maintenance": 5
    },
    "priorityDistribution": {
      "critical": 8,
      "high": 15,
      "normal": 22,
      "low": 0
    },
    "pendingChecks": 7,
    "recentlyChecked": 25
  },
  "pendingChecks": [
    {
      "_id": "65a1b2c3d4e5f6789abcdef2",
      "type": "network_connectivity",
      "status": "active",
      "priority": "critical",
      "location": "Server Room A",
      "nextCheck": "2024-12-10T14:30:00.000Z",
      "controller": {
        "_id": "65a1b2c3d4e5f6789abcdef0",
        "name": "Main Controller",
        "code": "CTRL001"
      }
    }
  ],
  "errorCheckpoints": [
    {
      "_id": "65a1b2c3d4e5f6789abcdef3",
      "type": "database_connection",
      "status": "error",
      "priority": "high",
      "location": "Database Server",
      "lastCheck": "2024-12-10T13:45:00.000Z",
      "notes": "Connection timeout"
    }
  ],
  "criticalCheckpoints": [
    {
      "_id": "65a1b2c3d4e5f6789abcdef4",
      "type": "system_health",
      "status": "active",
      "priority": "critical",
      "location": "Main Server",
      "lastCheck": "2024-12-10T14:00:00.000Z"
    }
  ]
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

### Create Checkpoint
```powershell
$checkpointBody = @{
    controllerId = "65a1b2c3d4e5f6789abcdef0"  # Replace with actual controller ID
    type = "system_health"
    status = "active"
    location = "Data Center - Floor 2"
    coordinates = @{
        latitude = 45.4642
        longitude = 9.1900
    }
    priority = "high"
    description = "Monitoring system health and performance"
    notes = "Critical system - monitor every 30 minutes"
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "http://localhost:3001/checkpoints" -Method POST -Body $checkpointBody -ContentType "application/json"
```

### Get Checkpoints by Status
```powershell
# Get all active checkpoints
Invoke-RestMethod -Uri "http://localhost:3001/checkpoints/status/active" -Method GET

# Get all error checkpoints
Invoke-RestMethod -Uri "http://localhost:3001/checkpoints/status/error" -Method GET
```

### Update Checkpoint Status
```powershell
$statusBody = @{
    status = "error"
    notes = "Service not responding - investigating"
    result = @{
        message = "HTTP 500 Internal Server Error"
        data = @{
            endpoint = "https://api.example.com/health"
            responseTime = "timeout"
            statusCode = 500
        }
    }
} | ConvertTo-Json -Depth 3

# Replace with actual checkpoint ID
$checkpointId = "65a1b2c3d4e5f6789abcdef0"
Invoke-RestMethod -Uri "http://localhost:3001/checkpoints/$checkpointId/status" -Method PUT -Body $statusBody -ContentType "application/json"
```

### Get Dashboard Data
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/checkpoints/dashboard" -Method GET
```

## Notes

1. **MongoDB ObjectId**: User, Appointment, and Checkpoint IDs are MongoDB ObjectIds (24 character hex strings)
2. **Date Format**: Dates must be in YYYY-MM-DD format
3. **Time Format**: Times must be in HH:MM format (24-hour)
4. **Appointment Validation**: 
   - Title minimum 3 characters
   - Valid userId required
   - No scheduling conflicts for same user at same date/time
5. **Checkpoint Validation**:
   - Type minimum 2 characters
   - Valid controllerId required
   - Status must be: active, inactive, error, maintenance
   - Priority must be: low, normal, high, critical
   - Coordinates must have valid latitude (-90 to 90) and longitude (-180 to 180)
   - Result must be an object with message (string) and data (any type or null)
6. **Status Values**: 
   - Appointments: scheduled, confirmed, completed, cancelled
   - Checkpoints: active, inactive, error, maintenance
7. **Priority Values**: low, normal, high, critical
8. **Duration**: In minutes (default: 30 for appointments)
9. **Pagination**: Default page size is 10, can be customized with `limit` parameter
10. **Timestamps**: `createdAt` and `updatedAt` are automatically managed
12. **Auto-scheduling**: Checkpoint status updates automatically set `lastCheck` and `nextCheck` times
13. **Result Structure**: `result` field contains `message` (string) and `data` (any type or null, e.g., URL, object, array)
14. **Lookup Relations**: Appointment and Checkpoint responses include related user/controller information via MongoDB aggregation