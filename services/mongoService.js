const { MongoClient, ObjectId } = require('mongodb');

class MongoDBService {
  constructor() {
    this.client = null;
    this.db = null;
  }

  async connect() {
    try {
      this.client = new MongoClient(process.env.MONGODB_URI);
      await this.client.connect();
      this.db = this.client.db(process.env.DB_NAME);
      console.log('MongoDB connected successfully');
      return this.db;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      console.log('MongoDB connection closed');
    }
  }

  getDatabase() {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  getCollection(collectionName) {
    return this.getDatabase().collection(collectionName);
  }

  // Utility method to validate ObjectId
  isValidObjectId(id) {
    return ObjectId.isValid(id);
  }

  // Create a new ObjectId
  createObjectId(id) {
    return new ObjectId(id);
  }

  // Generic CRUD operations
  async findAll(collectionName, filter = {}, options = {}) {
    try {
      const collection = this.getCollection(collectionName);
      return await collection.find(filter, options).toArray();
    } catch (error) {
      console.error(`Error finding documents in ${collectionName}:`, error);
      throw error;
    }
  }

  async findOne(collectionName, filter) {
    try {
      const collection = this.getCollection(collectionName);
      return await collection.findOne(filter);
    } catch (error) {
      console.error(`Error finding document in ${collectionName}:`, error);
      throw error;
    }
  }

  async findById(collectionName, id) {
    try {
      if (!this.isValidObjectId(id)) {
        throw new Error('Invalid ObjectId format');
      }
      const collection = this.getCollection(collectionName);
      return await collection.findOne({ _id: this.createObjectId(id) });
    } catch (error) {
      console.error(`Error finding document by ID in ${collectionName}:`, error);
      throw error;
    }
  }

  async insertOne(collectionName, document) {
    try {
      const collection = this.getCollection(collectionName);
      const documentWithTimestamps = {
        ...document,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      return await collection.insertOne(documentWithTimestamps);
    } catch (error) {
      console.error(`Error inserting document in ${collectionName}:`, error);
      throw error;
    }
  }

  async insertMany(collectionName, documents) {
    try {
      const collection = this.getCollection(collectionName);
      const documentsWithTimestamps = documents.map(doc => ({
        ...doc,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      return await collection.insertMany(documentsWithTimestamps);
    } catch (error) {
      console.error(`Error inserting documents in ${collectionName}:`, error);
      throw error;
    }
  }

  async updateOne(collectionName, filter, update, options = {}) {
    try {
      const collection = this.getCollection(collectionName);
      const updateWithTimestamp = {
        ...update,
        $set: {
          ...update.$set,
          updatedAt: new Date()
        }
      };
      return await collection.updateOne(filter, updateWithTimestamp, options);
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      throw error;
    }
  }

  async updateById(collectionName, id, update, options = {}) {
    try {
      if (!this.isValidObjectId(id)) {
        throw new Error('Invalid ObjectId format');
      }
      return await this.updateOne(
        collectionName,
        { _id: this.createObjectId(id) },
        update,
        options
      );
    } catch (error) {
      console.error(`Error updating document by ID in ${collectionName}:`, error);
      throw error;
    }
  }

  async findOneAndUpdate(collectionName, filter, update, options = {}) {
    try {
      const collection = this.getCollection(collectionName);
      const updateWithTimestamp = {
        ...update,
        $set: {
          ...update.$set,
          updatedAt: new Date()
        }
      };
      return await collection.findOneAndUpdate(filter, updateWithTimestamp, {
        returnDocument: 'after',
        ...options
      });
    } catch (error) {
      console.error(`Error finding and updating document in ${collectionName}:`, error);
      throw error;
    }
  }

  async deleteOne(collectionName, filter) {
    try {
      const collection = this.getCollection(collectionName);
      return await collection.deleteOne(filter);
    } catch (error) {
      console.error(`Error deleting document in ${collectionName}:`, error);
      throw error;
    }
  }

  async deleteById(collectionName, id) {
    try {
      if (!this.isValidObjectId(id)) {
        throw new Error('Invalid ObjectId format');
      }
      return await this.deleteOne(collectionName, { _id: this.createObjectId(id) });
    } catch (error) {
      console.error(`Error deleting document by ID in ${collectionName}:`, error);
      throw error;
    }
  }

  async deleteMany(collectionName, filter) {
    try {
      const collection = this.getCollection(collectionName);
      return await collection.deleteMany(filter);
    } catch (error) {
      console.error(`Error deleting documents in ${collectionName}:`, error);
      throw error;
    }
  }

  async countDocuments(collectionName, filter = {}) {
    try {
      const collection = this.getCollection(collectionName);
      return await collection.countDocuments(filter);
    } catch (error) {
      console.error(`Error counting documents in ${collectionName}:`, error);
      throw error;
    }
  }

  async aggregate(collectionName, pipeline) {
    try {
      const collection = this.getCollection(collectionName);
      return await collection.aggregate(pipeline).toArray();
    } catch (error) {
      console.error(`Error running aggregation in ${collectionName}:`, error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const mongoService = new MongoDBService();

module.exports = mongoService;