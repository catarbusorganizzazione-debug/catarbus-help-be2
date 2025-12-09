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

### User Creation Success Response
```json
{
  "_id": "65a1b2c3d4e5f6789abcdef0",
  "name": "Mario Rossi",
  "email": "mario.rossi@email.com",
  "status": "active",
  "createdAt": "2023-12-08T10:30:45.123Z",
  "updatedAt": "2023-12-08T10:30:45.123Z"
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

### Create Basic User (without password)
```powershell
$userBody = @{
    name = "Anna Verde"
    email = "anna.verde@email.com"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/users" -Method POST -Body $userBody -ContentType "application/json"
```

## Notes

1. **MongoDB ObjectId**: User IDs are MongoDB ObjectIds (24 character hex strings)
2. **Validation**: Names must be at least 2 characters, emails must be valid format
3. **Pagination**: Default page size is 10, can be customized with `limit` parameter
4. **Timestamps**: `createdAt` and `updatedAt` are automatically managed
5. **Error Handling**: All endpoints return appropriate HTTP status codes and error messages