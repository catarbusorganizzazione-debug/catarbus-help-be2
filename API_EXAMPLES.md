# Catarbus Help Backend API Testing

This file contains example requests to test the MongoDB-powered API endpoints.

## Prerequisites
Make sure MongoDB is running on your system and the server is started with `npm start` or `npm run dev`.

## Base URL
```
http://localhost:3000
```

## API Endpoints

### 1. Get API Documentation
```bash
curl -X GET http://localhost:3000/
```

### 2. Create a new user
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mario Rossi",
    "email": "mario.rossi@email.com"
  }'
```

### 3. Create another user
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Giulia Bianchi", 
    "email": "giulia.bianchi@email.com"
  }'
```

### 4. Get all users (with pagination)
```bash
# Get first page (default)
curl -X GET http://localhost:3000/users

# Get second page with custom limit
curl -X GET "http://localhost:3000/users?page=2&limit=5"

# Filter by status
curl -X GET "http://localhost:3000/users?status=active"
```

### 5. Get user by ID
```bash
# Replace {user_id} with actual MongoDB ObjectId
curl -X GET http://localhost:3000/users/{user_id}
```

### 6. Update user
```bash
# Replace {user_id} with actual MongoDB ObjectId
curl -X PUT http://localhost:3000/users/{user_id} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mario Rossi Updated",
    "email": "mario.updated@email.com"
  }'
```

### 7. Search users
```bash
# Search by name or email
curl -X GET http://localhost:3000/users/search/mario

# Search with pagination
curl -X GET "http://localhost:3000/users/search/bianchi?page=1&limit=5"
```

### 8. Get user statistics
```bash
curl -X GET http://localhost:3000/users/stats
```

### 9. Delete user
```bash
# Replace {user_id} with actual MongoDB ObjectId
curl -X DELETE http://localhost:3000/users/{user_id}
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

### Create User
```powershell
$body = @{
    name = "Marco Verdi"
    email = "marco.verdi@email.com"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/users" -Method POST -Body $body -ContentType "application/json"
```

### Get All Users
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/users" -Method GET
```

### Search Users
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/users/search/marco" -Method GET
```

## Notes

1. **MongoDB ObjectId**: User IDs are MongoDB ObjectIds (24 character hex strings)
2. **Validation**: Names must be at least 2 characters, emails must be valid format
3. **Pagination**: Default page size is 10, can be customized with `limit` parameter
4. **Timestamps**: `createdAt` and `updatedAt` are automatically managed
5. **Error Handling**: All endpoints return appropriate HTTP status codes and error messages