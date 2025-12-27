const mongoService = require('../services/mongoService');

class UserModel {
  static collectionName = 'users';

  // Validation schema
  static validateUser(userData) {
    const errors = [];

    if (!userData.name || typeof userData.name !== 'string' || userData.name.trim().length < 2) {
      errors.push('Name is required and must be at least 2 characters long');
    }

    if (userData.email && typeof userData.email !== 'string') {
      errors.push('Email must be a string');
    }

    if (userData.email && userData.email.trim() !== '' && !this.isValidEmail(userData.email)) {
      errors.push('Email format is invalid');
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

  // Get all users with optional filtering and pagination
  static async findAll(filter = {}, options = {}) {
    try {
      const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
      const skip = (page - 1) * limit;

      const users = await mongoService.findAll(this.collectionName, filter, {
        sort,
        skip
      });

      const total = await mongoService.countDocuments(this.collectionName, filter);

      return {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
  }

  // Get user by ID
  static async findById(id) {
    try {
      return await mongoService.findById(this.collectionName, id);
    } catch (error) {
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
  }

  // Get user by email
  static async findByEmail(email) {
    try {
      return await mongoService.findOne(this.collectionName, { email });
    } catch (error) {
      throw new Error(`Failed to fetch user by email: ${error.message}`);
    }
  }

  // Create a new user
  static async create(userData) {
    try {
      // Validate input
      const validation = this.validateUser(userData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check if email already exists (if provided)
      if (userData.email && userData.email.trim() !== '') {
        const existingUser = await this.findByEmail(userData.email);
        if (existingUser) {
          throw new Error('User with this email already exists');
        }
      }

      // Clean and prepare user data
      const cleanUserData = {
        name: userData.name.trim(),
        email: userData.email ? userData.email.trim() : null,
        status: userData.status || 'active',
        ...userData
      };

      // Insert user
      const result = await mongoService.insertOne(this.collectionName, cleanUserData);

      // Return the created user
      return await this.findById(result.insertedId);
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  // Update user by ID
  static async updateById(id, updateData) {
    try {
      // Validate ObjectId
      if (!mongoService.isValidObjectId(id)) {
        throw new Error('Invalid user ID format');
      }

      // Validate update data
      if (Object.keys(updateData).length === 0) {
        throw new Error('No update data provided');
      }

      // Validate fields if they exist in update data
      const validation = this.validateUser({ name: 'temp', ...updateData });
      if (updateData.name && !validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check if email already exists (if being updated)
      if (updateData.email && updateData.email.trim() !== '') {
        const existingUser = await this.findByEmail(updateData.email);
        if (existingUser && existingUser._id.toString() !== id) {
          throw new Error('User with this email already exists');
        }
      }

      // Clean update data
      const cleanUpdateData = {};
      if (updateData.name) cleanUpdateData.name = updateData.name.trim();
      if (updateData.email !== undefined) cleanUpdateData.email = updateData.email ? updateData.email.trim() : null;
      if (updateData.status) cleanUpdateData.status = updateData.status;

      // Update user
      const result = await mongoService.findOneAndUpdate(
        this.collectionName,
        { _id: mongoService.createObjectId(id) },
        { $set: cleanUpdateData }
      );

      if (!result) {
        throw new Error('User not found');
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  // Update user by username
  static async updateByUsername(username, updateData) {
    try {
      // Validate update data
      if (Object.keys(updateData).length === 0) {
        throw new Error('No update data provided');
      }

      // Validate fields if they exist in update data
      const validation = this.validateUser({ name: 'temp', ...updateData });
      if (updateData.name && !validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check if email already exists (if being updated)
      if (updateData.email && updateData.email.trim() !== '') {
        const existingUser = await this.findByEmail(updateData.email);
        if (existingUser && existingUser.username !== username.trim().toLowerCase()) {
          throw new Error('User with this email already exists');
        }
      }

      const currentUser = await mongoService.findOne(
        this.collectionName,
        { username: username.trim().toLowerCase() }
      );

      // Clean update data
      const cleanUpdateData = {};
      if (updateData.name) cleanUpdateData.name = updateData.name.trim();
      if (updateData.email !== undefined) cleanUpdateData.email = updateData.email ? updateData.email.trim() : null;
      if (updateData.status) cleanUpdateData.status = updateData.status;
      if (updateData.checkpointsCompleted && currentUser !== null && Number(currentUser.checkpointsCompleted) - Number(currentUser.checkpointsCompleted) === Number(1)) cleanUpdateData.checkpointsCompleted = Number(currentUser.checkpointsCompleted) + 1;
      if (updateData.lastMajorCheckpoint) cleanUpdateData.lastCheckpoint = new Date(updateData.lastMajorCheckpoint);
      if (updateData.lastMinorCheckpoint) cleanUpdateData.lastMinorCheckpoint = new Date(updateData.lastMinorCheckpoint);
      if (updateData.lastHelp) cleanUpdateData.lastHelp = new Date(updateData.lastHelp);

      // Update user
      const result = await mongoService.findOneAndUpdate(
        this.collectionName,
        { username: username.trim().toLowerCase() },
        { $set: cleanUpdateData }
      );

      if (!result) {
        throw new Error('User not found');
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  // Delete user by ID
  static async deleteById(id) {
    try {
      const result = await mongoService.deleteById(this.collectionName, id);

      if (result.deletedCount === 0) {
        throw new Error('User not found');
      }

      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  // Search users by name or email
  static async search(searchTerm, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const skip = (page - 1) * limit;

      const filter = {
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } },
          { username: { $regex: searchTerm, $options: 'i' } }
        ]
      };

      const users = await mongoService.findAll(this.collectionName, filter, {
        sort: { createdAt: -1 },
        skip,
        limit: parseInt(limit)
      });

      const total = await mongoService.countDocuments(this.collectionName, filter);

      return {
        users,
        searchTerm,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Failed to search users: ${error.message}`);
    }
  }

  // Get users statistics
  static async getStats() {
    try {
      const totalUsers = await mongoService.countDocuments(this.collectionName);
      const activeUsers = await mongoService.countDocuments(this.collectionName, { status: 'active' });

      const recentUsers = await mongoService.findAll(this.collectionName, {}, {
        sort: { createdAt: -1 },
        limit: 5
      });

      return {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        recentUsers
      };
    } catch (error) {
      throw new Error(`Failed to get user statistics: ${error.message}`);
    }
  }

  // Get users ranking by checkpoints completed
  static async getRanking(options = {}) {
    try {
      const { limit = 20 } = options;

      const pipeline = [
        {
          $match: {
            $or: [
              { isAdminUseOnly: { $ne: true } },
              { isAdminUseOnly: { $exists: false } }
            ]
          }
        },
        {
          $project: {
            name: 1,
            checkpointsCompleted: 1,
            colour: 1,
          }
        },
        {
          $sort: { checkpointsCompleted: -1, lastCheckpoint: 1}
        },
        {
          $limit: parseInt(limit)
        }
      ];

      const users = await mongoService.aggregate(this.collectionName, pipeline);

      return {
        ranking: users,
        totalUsers: users.length
      };
    } catch (error) {
      throw new Error(`Failed to get user ranking: ${error.message}`);
    }
  }


  static async updateScoreByUsername(username, isMajorCheckPoint) {
    try {

      const currentUser = await mongoService.findOne(
        this.collectionName,
        { username: username.trim().toLowerCase() }
      );

      const cleanUpdateData = {};
      if (isMajorCheckPoint === true) {

      let now = new Date();
      now = now.setHours(now.getHours() + 1); 
        cleanUpdateData.checkpointsCompleted = Number(currentUser.checkpointsCompleted) + 1;
        cleanUpdateData.lastCheckpoint = new Date(now);
        cleanUpdateData.lastHelp = new Date(now);
      } else {
        cleanUpdateData.lastMinorCheckpoint = new Date(lastMinorCheckpoint);
      }


      const result = await mongoService.findOneAndUpdate(
        this.collectionName,
        { username: username.trim().toLowerCase() },
        { $set: cleanUpdateData }
      );

      if (!result) {
        throw new Error('User not found');
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

}

module.exports = UserModel;