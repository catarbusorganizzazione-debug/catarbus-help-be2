const mongoService = require('../services/mongoService');

class CheckpointModel {
  static collectionName = 'checkpoints';

  // Validation schema for checkpoints
  static validateCheckpoint(checkpointData) {
    const errors = [];
    
    if (!checkpointData.internalId || typeof checkpointData.internalId !== 'string' || checkpointData.internalId.trim().length < 2) {
      errors.push('InternalId is required and must be at least 2 characters long');
    }
    
    if (!checkpointData.location || typeof checkpointData.location !== 'string' || checkpointData.location.trim().length < 2) {
      errors.push('Location is required and must be at least 2 characters long');
    }
    
    if (checkpointData.description !== undefined && checkpointData.description !== null && typeof checkpointData.description !== 'string') {
      errors.push('Description must be a string when provided');
    }
    
    if (typeof checkpointData.isMajorCheckpoint !== 'boolean') {
      errors.push('IsMajorCheckpoint must be a boolean value');
    }
    
    if (checkpointData.result && !this.isValidResult(checkpointData.result)) {
      errors.push('Result must be an object with message (string) and data (any type or null)');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static isValidResult(result) {
    return result && 
           typeof result === 'object' &&
           typeof result.message === 'string' &&
           result.message.trim().length > 0 &&
           (result.data === null || result.data !== undefined);
  }

  // Get all checkpoints with optional filtering and pagination
  static async findAll(filter = {}, options = {}) {
    try {
      const { page = 1, limit = 10, sort = { isMajorCheckpoint: -1, createdAt: -1 } } = options;
      const skip = (page - 1) * limit;
      
      const pipeline = [
        { $match: filter },
        {
          $project: {
            _id: 1,
            internalId: 1,
            location: 1,
            description: 1,
            isMajorCheckpoint: 1,
            result: 1,
            createdAt: 1,
            updatedAt: 1
          }
        },
        { $sort: sort },
        { $skip: skip },
        { $limit: parseInt(limit) }
      ];
      
      const checkpoints = await mongoService.aggregate(this.collectionName, pipeline);
      const total = await mongoService.countDocuments(this.collectionName, filter);
      
      return {
        checkpoints,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalCheckpoints: total,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch checkpoints: ${error.message}`);
    }
  }

  // Get checkpoint by ID
  static async findById(id) {
    try {
      const pipeline = [
        { $match: { _id: mongoService.createObjectId(id) } },
        {
          $project: {
            _id: 1,
            internalId: 1,
            location: 1,
            description: 1,
            isMajorCheckpoint: 1,
            result: 1,
            createdAt: 1,
            updatedAt: 1
          }
        }
      ];
      
      const result = await mongoService.aggregate(this.collectionName, pipeline);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      throw new Error(`Failed to fetch checkpoint: ${error.message}`);
    }
  }

  // Get checkpoints by internalId (partial match)
  static async findByInternalId(internalId, options = {}) {
    try {
      const filter = { internalId: { $regex: internalId, $options: 'i' } };
      return await this.findAll(filter, options);
    } catch (error) {
      throw new Error(`Failed to fetch checkpoints by internalId: ${error.message}`);
    }
  }

  // Get major checkpoints only
  static async findMajorCheckpoints(options = {}) {
    try {
      const filter = { isMajorCheckpoint: true };
      return await this.findAll(filter, options);
    } catch (error) {
      throw new Error(`Failed to fetch major checkpoints: ${error.message}`);
    }
  }

  // Get checkpoints by location (partial match)
  static async findByLocation(location, options = {}) {
    try {
      const filter = {
        location: { $regex: location, $options: 'i' }
      };
      
      return await this.findAll(filter, options);
    } catch (error) {
      throw new Error(`Failed to search checkpoints by location: ${error.message}`);
    }
  }

  // Create a new checkpoint
  static async create(checkpointData) {
    try {
      // Validate input
      const validation = this.validateCheckpoint(checkpointData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check if internalId already exists
      const existingCheckpoint = await mongoService.findOne(this.collectionName, { 
        internalId: checkpointData.internalId 
      });
      if (existingCheckpoint) {
        throw new Error('Checkpoint with this internalId already exists');
      }

      // Prepare checkpoint data
      const cleanCheckpointData = {
        internalId: checkpointData.internalId.trim(),
        location: checkpointData.location.trim(),
        description: checkpointData.description ? checkpointData.description.trim() : null,
        isMajorCheckpoint: checkpointData.isMajorCheckpoint,
        result: checkpointData.result || null
      };

      // Insert checkpoint
      const result = await mongoService.insertOne(this.collectionName, cleanCheckpointData);
      
      // Return the created checkpoint
      return await this.findById(result.insertedId);
    } catch (error) {
      throw new Error(`Failed to create checkpoint: ${error.message}`);
    }
  }

  // Update checkpoint by ID
  static async updateById(id, updateData) {
    try {
      // Validate ObjectId
      if (!mongoService.isValidObjectId(id)) {
        throw new Error('Invalid checkpoint ID format');
      }

      // Validate update data if present
      if (Object.keys(updateData).length === 0) {
        throw new Error('No update data provided');
      }

      // Validate fields if they exist in update data
      if (updateData.internalId || updateData.location || updateData.isMajorCheckpoint !== undefined) {
        const validation = this.validateCheckpoint({ 
          internalId: 'temp', 
          location: 'temp', 
          isMajorCheckpoint: true,
          ...updateData 
        });
        
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
      }

      // Check if internalId already exists (if being updated)
      if (updateData.internalId) {
        const existingCheckpoint = await mongoService.findOne(this.collectionName, {
          internalId: updateData.internalId,
          _id: { $ne: mongoService.createObjectId(id) }
        });
        if (existingCheckpoint) {
          throw new Error('Checkpoint with this internalId already exists');
        }
      }

      // Clean update data
      const cleanUpdateData = {};
      if (updateData.internalId) cleanUpdateData.internalId = updateData.internalId.trim();
      if (updateData.location) cleanUpdateData.location = updateData.location.trim();
      if (updateData.description !== undefined) cleanUpdateData.description = updateData.description ? updateData.description.trim() : null;
      if (updateData.isMajorCheckpoint !== undefined) cleanUpdateData.isMajorCheckpoint = updateData.isMajorCheckpoint;
      if (updateData.result !== undefined) cleanUpdateData.result = updateData.result;

      // Update checkpoint
      const result = await mongoService.findOneAndUpdate(
        this.collectionName,
        { _id: mongoService.createObjectId(id) },
        { $set: cleanUpdateData }
      );

      if (!result) {
        throw new Error('Checkpoint not found');
      }

      return await this.findById(id);
    } catch (error) {
      throw new Error(`Failed to update checkpoint: ${error.message}`);
    }
  }

  // Update checkpoint result
  static async updateResult(id, result) {
    try {
      // Validate result if provided
      if (result && !this.isValidResult(result)) {
        throw new Error('Result must be an object with message (string) and data (any type or null)');
      }

      const updateData = {
        result: result,
        updatedAt: new Date()
      };

      const updateResult = await mongoService.findOneAndUpdate(
        this.collectionName,
        { _id: mongoService.createObjectId(id) },
        { $set: updateData }
      );

      if (!updateResult) {
        throw new Error('Checkpoint not found');
      }

      return await this.findById(id);
    } catch (error) {
      throw new Error(`Failed to update checkpoint result: ${error.message}`);
    }
  }

  // Delete checkpoint by ID
  static async deleteById(id) {
    try {
      const result = await mongoService.deleteById(this.collectionName, id);
      
      if (result.deletedCount === 0) {
        throw new Error('Checkpoint not found');
      }

      return { success: true, message: 'Checkpoint deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete checkpoint: ${error.message}`);
    }
  }

  // Get checkpoint statistics
  static async getStats() {
    try {
      const totalCheckpoints = await mongoService.countDocuments(this.collectionName);
      const majorCheckpoints = await mongoService.countDocuments(this.collectionName, { isMajorCheckpoint: true });
      const minorCheckpoints = totalCheckpoints - majorCheckpoints;
      
      // Checkpoints with results
      const checkpointsWithResults = await mongoService.countDocuments(this.collectionName, {
        result: { $exists: true, $ne: null }
      });
      
      // Recent activity (last 24 hours)
      const oneDayAgo = new Date(Date.now() - (24 * 60 * 60 * 1000));
      const recentlyUpdated = await mongoService.countDocuments(this.collectionName, {
        updatedAt: { $gte: oneDayAgo }
      });

      return {
        totalCheckpoints,
        majorCheckpoints,
        minorCheckpoints,
        checkpointsWithResults,
        recentlyUpdated
      };
    } catch (error) {
      throw new Error(`Failed to get checkpoint statistics: ${error.message}`);
    }
  }

  // Get checkpoints dashboard data
  static async getDashboardData() {
    try {
      const stats = await this.getStats();
      const majorCheckpoints = await this.findMajorCheckpoints({ limit: 10 });
      const recentCheckpoints = await this.findAll({}, { 
        limit: 5, 
        sort: { updatedAt: -1 } 
      });

      return {
        stats,
        majorCheckpoints: majorCheckpoints.checkpoints,
        recentCheckpoints: recentCheckpoints.checkpoints
      };
    } catch (error) {
      throw new Error(`Failed to get dashboard data: ${error.message}`);
    }
  }
}

module.exports = CheckpointModel;