const mongoService = require('../services/mongoService');
const crypto = require('crypto');

class AuthModel {
  static collectionName = 'users';

  // Validate login credentials
  static validateLoginData(loginData) {
    const errors = [];
       
    if (!loginData.username) {
      errors.push('Username is required');
    }
    
    if (!loginData.password || typeof loginData.password !== 'string' || loginData.password.length !== 64) {
      errors.push('Password must be a valid SHA256 hash (64 characters)');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Hash password with SHA256 (for internal use if needed)
  static hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  // Find user by username for login
  static async findUserByUsername(username) {
    try {
      return await mongoService.findOne(this.collectionName, { username: username.trim().toLowerCase() });
    } catch (error) {
      throw new Error(`Failed to find user by username: ${error.message}`);
    }
  }

  // Authenticate user with username and SHA256 password
  static async authenticateUser(username, sha256Password) {
    try {
      // Validate input
      const validation = this.validateLoginData({ username: username, password: sha256Password });
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Find user by username
      const user = await this.findUserByUsername(username);
      if (!user) {
        throw new Error('Invalid username or password');
      }

      // Check if user has a password field
      if (!user.password) {
        throw new Error('User account is not properly configured');
      }

      // Compare SHA256 passwords
      if (user.password !== sha256Password) {
        throw new Error('Invalid email or password');
      }

      // Check if user account is active
      if (user.status && user.status !== 'active') {
        throw new Error('Account is not active');
      }

      // Update last login timestamp
      await mongoService.updateOne(
        this.collectionName,
        { _id: user._id },
        { 
          $set: { 
            lastLogin: new Date(),
            updatedAt: new Date()
          }
        }
      );

      // Return user data without password
      const { password, ...userWithoutPassword } = user;
      return {
        user: userWithoutPassword,
        loginTime: new Date()
      };
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  // Create user with SHA256 password
  static async createUserWithPassword(userData) {
    try {
      const { email, password, name, ...otherData } = userData;

      // Validate required fields
      if (!name || !email || !password) {
        throw new Error('Name, email and password are required');
      }

      // Validate email format
      if (!this.isValidEmail(email)) {
        throw new Error('Invalid email format');
      }

      // Validate password is SHA256 hash
      if (password.length !== 64) {
        throw new Error('Password must be a valid SHA256 hash (64 characters)');
      }

      // Check if user already exists
      const existingUser = await this.findUserByEmail(email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create user with hashed password
      const newUser = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password, // Already SHA256 hashed
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null,
        ...otherData
      };

      const result = await mongoService.insertOne(this.collectionName, newUser);
      
      // Return user without password
      const createdUser = await mongoService.findById(this.collectionName, result.insertedId);
      const { password: _, ...userWithoutPassword } = createdUser;
      
      return userWithoutPassword;
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  // Change user password
  static async changePassword(userId, oldPassword, newPassword) {
    try {
      // Validate passwords are SHA256 hashes
      if (oldPassword.length !== 64 || newPassword.length !== 64) {
        throw new Error('Passwords must be valid SHA256 hashes (64 characters)');
      }

      // Find user
      const user = await mongoService.findById(this.collectionName, userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify old password
      if (user.password !== oldPassword) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      await mongoService.updateById(
        this.collectionName,
        userId,
        { 
          $set: { 
            password: newPassword,
            updatedAt: new Date()
          }
        }
      );

      return { success: true, message: 'Password updated successfully' };
    } catch (error) {
      throw new Error(`Failed to change password: ${error.message}`);
    }
  }

  // Reset password (for admin use)
  static async resetPassword(userId, newPassword) {
    try {
      // Validate password is SHA256 hash
      if (newPassword.length !== 64) {
        throw new Error('Password must be a valid SHA256 hash (64 characters)');
      }

      // Update password
      const result = await mongoService.updateById(
        this.collectionName,
        userId,
        { 
          $set: { 
            password: newPassword,
            updatedAt: new Date()
          }
        }
      );

      if (result.matchedCount === 0) {
        throw new Error('User not found');
      }

      return { success: true, message: 'Password reset successfully' };
    } catch (error) {
      throw new Error(`Failed to reset password: ${error.message}`);
    }
  }

  // Get login statistics
  static async getLoginStats() {
    try {
      const totalUsers = await mongoService.countDocuments(this.collectionName);
      const activeUsers = await mongoService.countDocuments(this.collectionName, { status: 'active' });
      const usersWithPassword = await mongoService.countDocuments(this.collectionName, { 
        password: { $exists: true, $ne: null } 
      });
      
      const recentLogins = await mongoService.findAll(this.collectionName, 
        { lastLogin: { $exists: true, $ne: null } }, 
        {
          sort: { lastLogin: -1 },
          limit: 10
        }
      );

      return {
        totalUsers,
        activeUsers,
        usersWithPassword,
        recentLogins: recentLogins.map(user => ({
          _id: user._id,
          name: user.name,
          email: user.email,
          lastLogin: user.lastLogin
        }))
      };
    } catch (error) {
      throw new Error(`Failed to get login statistics: ${error.message}`);
    }
  }
}

module.exports = AuthModel;