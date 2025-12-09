// Import necessary modules
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const mongoService = require('./services/mongoService');
const UserModel = require('./models/UserModel');
const AuthModel = require('./models/AuthModel');

// Load environment variables
dotenv.config();

// Initialize the app
const app = express();

// Middleware to parse JSON data
app.use(bodyParser.json());

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoService.disconnect();
  process.exit(0);
});

// Define a basic route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Catarbus Help Backend with MongoDB!',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /auth/login': 'User login with email and SHA256 password',
        'POST /auth/register': 'Register new user with SHA256 password',
        'POST /auth/change-password': 'Change user password',
        'POST /auth/reset-password': 'Reset user password (admin)',
        'GET /auth/stats': 'Get login statistics'
      },
      users: {
        'GET /users': 'Get all users (with pagination)',
        'GET /users/:id': 'Get user by ID',
        'GET /users/search/:term': 'Search users by name or email',
        'GET /users/stats': 'Get user statistics',
        'POST /users': 'Create new user',
        'PUT /users/:id': 'Update user by ID',
        'DELETE /users/:id': 'Delete user by ID'
      }
    }
  });
});

// AUTH ENDPOINTS

// User login endpoint
app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const result = await AuthModel.authenticateUser(username, password);
    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ 
      success: false,
      error: error.message 
    });
  }
});

// User registration endpoint
app.post('/auth/register', async (req, res) => {
  try {
    const user = await AuthModel.createUserWithPassword(req.body);
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Change password endpoint
app.post('/auth/change-password', async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;
    
    if (!userId || !oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'userId, oldPassword, and newPassword are required'
      });
    }
    
    const result = await AuthModel.changePassword(userId, oldPassword, newPassword);
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Reset password endpoint (admin only)
app.post('/auth/reset-password', async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    
    if (!userId || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'userId and newPassword are required'
      });
    }
    
    const result = await AuthModel.resetPassword(userId, newPassword);
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get login statistics
app.get('/auth/stats', async (req, res) => {
  try {
    const stats = await AuthModel.getLoginStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching auth stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// USER ENDPOINTS

// Route to get user statistics
app.get('/users/stats', async (req, res) => {
  try {
    const stats = await UserModel.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route to search users
app.get('/users/search/:term', async (req, res) => {
  try {
    const searchTerm = req.params.term;
    const { page = 1, limit = 10 } = req.query;
    
    const result = await UserModel.search(searchTerm, { page: parseInt(page), limit: parseInt(limit) });
    res.json(result);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route to get all users
app.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = status ? { status } : {};
    
    const result = await UserModel.findAll(filter, { page: parseInt(page), limit: parseInt(limit) });
    res.json(result);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route to get a user by ID
app.get('/users/:id', async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route to create a new user
app.post('/users', async (req, res) => {
  try {
    const user = await UserModel.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(400).json({ error: error.message });
  }
});

// Route to update a user by ID
app.put('/users/:id', async (req, res) => {
  try {
    const user = await UserModel.updateById(req.params.id, req.body);
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// Route to delete a user by ID
app.delete('/users/:id', async (req, res) => {
  try {
    const result = await UserModel.deleteById(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server after connecting to MongoDB
async function startServer() {
  try {
    await mongoService.connect();
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`MongoDB connected to: ${process.env.MONGODB_URI}`);
      console.log('Available endpoints:');
      console.log('  GET /                         - API documentation');
      console.log('  POST /auth/login              - User login');
      console.log('  POST /auth/register           - Register new user');
      console.log('  POST /auth/change-password    - Change password');
      console.log('  POST /auth/reset-password     - Reset password');
      console.log('  GET /auth/stats               - Login statistics');
      console.log('  GET /users                    - Get all users');
      console.log('  GET /users/:id                - Get user by ID');
      console.log('  GET /users/search/:term       - Search users');
      console.log('  GET /users/stats              - Get user statistics');
      console.log('  POST /users                   - Create new user');
      console.log('  PUT /users/:id                - Update user');
      console.log('  DELETE /users/:id             - Delete user');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Initialize the application
startServer();