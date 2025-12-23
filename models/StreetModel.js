const mongoService = require('../services/mongoService');

class StreetModel {
  static collectionName = 'destinations';
  static verificationsCollectionName = 'streetVerifications';

  // Verify if a street record exists with provaId and location
  static async verify(provaId, location, username) {
    try {
      // Convert location to lowercase for case-insensitive search
      const normalizedLocation = location.toLowerCase().trim();
      
      // Check if record exists
      const existingRecord = await mongoService.findOne(this.collectionName, {
        provaId: provaId,
        destination: normalizedLocation
      });
      
      const verificationResult = existingRecord !== null;
      
      // Save verification attempt with username as key and current timestamp as value
      const verificationData = {
        [username]: new Date()
      };
      
      // Use upsert to either insert or update the verification record
      await mongoService.findOneAndUpdate(
        this.verificationsCollectionName,
        { provaId: provaId, location: normalizedLocation },
        { 
          $set: verificationData,
          $setOnInsert: { provaId: provaId, location: normalizedLocation }
        },
        { upsert: true }
      );
      
      return {
        verified: verificationResult,
        provaId: provaId,
        location: normalizedLocation,
        username: username,
        timestamp: new Date(),
        info: existingRecord !== null ? existingRecord.info : null
      };
      
    } catch (error) {
      throw new Error(`Failed to verify street: ${error.message}`);
    }
  }

  // Create a new street record
  static async create(streetData) {
    try {
      // Validate required fields
      if (!streetData.provaId || !streetData.location) {
        throw new Error('provaId and location are required');
      }

      // Normalize location to lowercase
      const cleanStreetData = {
        provaId: streetData.provaId,
        location: streetData.location.toLowerCase().trim(),
        ...streetData
      };

      // Check if record already exists
      const existingRecord = await mongoService.findOne(this.collectionName, {
        provaId: cleanStreetData.provaId,
        location: cleanStreetData.location
      });

      if (existingRecord) {
        throw new Error('Street record with this provaId and location already exists');
      }

      // Insert the new record
      const result = await mongoService.insertOne(this.collectionName, cleanStreetData);
      
      return await mongoService.findById(this.collectionName, result.insertedId);
    } catch (error) {
      throw new Error(`Failed to create street: ${error.message}`);
    }
  }

  // Get all streets with optional filtering and pagination
  static async findAll(filter = {}, options = {}) {
    try {
      const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
      const skip = (page - 1) * limit;
      
      const streets = await mongoService.findAll(this.collectionName, filter, {
        sort,
        skip,
        limit: parseInt(limit)
      });
      
      const total = await mongoService.countDocuments(this.collectionName, filter);
      
      return {
        streets,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalStreets: total,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch streets: ${error.message}`);
    }
  }

  // Get street by ID
  static async findById(id) {
    try {
      return await mongoService.findById(this.collectionName, id);
    } catch (error) {
      throw new Error(`Failed to fetch street: ${error.message}`);
    }
  }

  // Get verification history
  static async getVerificationHistory(options = {}) {
    try {
      const { page = 1, limit = 10, sort = { updatedAt: -1 } } = options;
      const skip = (page - 1) * limit;
      
      const verifications = await mongoService.findAll(this.verificationsCollectionName, {}, {
        sort,
        skip,
        limit: parseInt(limit)
      });
      
      const total = await mongoService.countDocuments(this.verificationsCollectionName);
      
      return {
        verifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalVerifications: total,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch verification history: ${error.message}`);
    }
  }
}

module.exports = StreetModel;