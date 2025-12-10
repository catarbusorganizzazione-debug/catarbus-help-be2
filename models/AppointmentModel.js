const mongoService = require('../services/mongoService');

class AppointmentModel {
  static collectionName = 'appointments';

  // Validation schema for appointments
  static validateAppointment(appointmentData) {
    const errors = [];
    
    if (!appointmentData.userId || !mongoService.isValidObjectId(appointmentData.userId)) {
      errors.push('Valid userId is required');
    }
    
    if (!appointmentData.title || typeof appointmentData.title !== 'string' || appointmentData.title.trim().length < 3) {
      errors.push('Title is required and must be at least 3 characters long');
    }
    
    if (!appointmentData.date || !this.isValidDate(appointmentData.date)) {
      errors.push('Valid date is required (format: YYYY-MM-DD)');
    }
    
    if (!appointmentData.time || !this.isValidTime(appointmentData.time)) {
      errors.push('Valid time is required (format: HH:MM)');
    }
    
    if (appointmentData.duration && (typeof appointmentData.duration !== 'number' || appointmentData.duration <= 0)) {
      errors.push('Duration must be a positive number (in minutes)');
    }
    
    if (appointmentData.status && !['scheduled', 'confirmed', 'completed', 'cancelled'].includes(appointmentData.status)) {
      errors.push('Status must be one of: scheduled, confirmed, completed, cancelled');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static isValidDate(dateString) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && date.toISOString().startsWith(dateString);
  }

  static isValidTime(timeString) {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return timeRegex.test(timeString);
  }

  // Get all appointments with optional filtering and pagination
  static async findAll(filter = {}, options = {}) {
    try {
      const { page = 1, limit = 10, sort = { date: 1, time: 1 } } = options;
      const skip = (page - 1) * limit;
      
      // Build aggregation pipeline to include user information
      const pipeline = [
        { $match: filter },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: {
            path: '$user',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            title: 1,
            description: 1,
            date: 1,
            time: 1,
            duration: 1,
            status: 1,
            notes: 1,
            createdAt: 1,
            updatedAt: 1,
            'user._id': 1,
            'user.name': 1,
            'user.email': 1
          }
        },
        { $sort: sort },
        { $skip: skip },
        { $limit: parseInt(limit) }
      ];
      
      const appointments = await mongoService.aggregate(this.collectionName, pipeline);
      const total = await mongoService.countDocuments(this.collectionName, filter);
      
      return {
        appointments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalAppointments: total,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch appointments: ${error.message}`);
    }
  }

  // Get appointment by ID with user information
  static async findById(id) {
    try {
      const pipeline = [
        { $match: { _id: mongoService.createObjectId(id) } },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: {
            path: '$user',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            title: 1,
            description: 1,
            date: 1,
            time: 1,
            duration: 1,
            status: 1,
            notes: 1,
            createdAt: 1,
            updatedAt: 1,
            'user._id': 1,
            'user.name': 1,
            'user.email': 1
          }
        }
      ];
      
      const result = await mongoService.aggregate(this.collectionName, pipeline);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      throw new Error(`Failed to fetch appointment: ${error.message}`);
    }
  }

  // Get appointments by user ID
  static async findByUserId(userId, options = {}) {
    try {
      if (!mongoService.isValidObjectId(userId)) {
        throw new Error('Invalid user ID format');
      }
      
      const filter = { userId: mongoService.createObjectId(userId) };
      return await this.findAll(filter, options);
    } catch (error) {
      throw new Error(`Failed to fetch user appointments: ${error.message}`);
    }
  }

  // Get appointments by date range
  static async findByDateRange(startDate, endDate, options = {}) {
    try {
      if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) {
        throw new Error('Invalid date format. Use YYYY-MM-DD');
      }
      
      const filter = {
        date: {
          $gte: startDate,
          $lte: endDate
        }
      };
      
      return await this.findAll(filter, options);
    } catch (error) {
      throw new Error(`Failed to fetch appointments by date range: ${error.message}`);
    }
  }

  // Create a new appointment
  static async create(appointmentData) {
    try {
      // Validate input
      const validation = this.validateAppointment(appointmentData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check if user exists
      const user = await mongoService.findById('users', appointmentData.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check for scheduling conflicts
      const conflictFilter = {
        userId: mongoService.createObjectId(appointmentData.userId),
        date: appointmentData.date,
        time: appointmentData.time,
        status: { $in: ['scheduled', 'confirmed'] }
      };
      
      const existingAppointment = await mongoService.findOne(this.collectionName, conflictFilter);
      if (existingAppointment) {
        throw new Error('User already has an appointment at this date and time');
      }

      // Prepare appointment data
      const cleanAppointmentData = {
        userId: mongoService.createObjectId(appointmentData.userId),
        title: appointmentData.title.trim(),
        description: appointmentData.description ? appointmentData.description.trim() : null,
        date: appointmentData.date,
        time: appointmentData.time,
        duration: appointmentData.duration || 30, // Default 30 minutes
        status: appointmentData.status || 'scheduled',
        notes: appointmentData.notes ? appointmentData.notes.trim() : null
      };

      // Insert appointment
      const result = await mongoService.insertOne(this.collectionName, cleanAppointmentData);
      
      // Return the created appointment with user info
      return await this.findById(result.insertedId);
    } catch (error) {
      throw new Error(`Failed to create appointment: ${error.message}`);
    }
  }

  // Update appointment by ID
  static async updateById(id, updateData) {
    try {
      // Validate ObjectId
      if (!mongoService.isValidObjectId(id)) {
        throw new Error('Invalid appointment ID format');
      }

      // Validate update data if present
      if (Object.keys(updateData).length === 0) {
        throw new Error('No update data provided');
      }

      // Validate fields if they exist in update data
      if (updateData.userId || updateData.title || updateData.date || updateData.time) {
        const validation = this.validateAppointment({ 
          userId: 'temp', 
          title: 'temp', 
          date: '2023-01-01', 
          time: '10:00', 
          ...updateData 
        });
        
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
      }

      // Clean update data
      const cleanUpdateData = {};
      if (updateData.title) cleanUpdateData.title = updateData.title.trim();
      if (updateData.description !== undefined) cleanUpdateData.description = updateData.description ? updateData.description.trim() : null;
      if (updateData.date) cleanUpdateData.date = updateData.date;
      if (updateData.time) cleanUpdateData.time = updateData.time;
      if (updateData.duration) cleanUpdateData.duration = updateData.duration;
      if (updateData.status) cleanUpdateData.status = updateData.status;
      if (updateData.notes !== undefined) cleanUpdateData.notes = updateData.notes ? updateData.notes.trim() : null;

      // Check for scheduling conflicts if date/time is being updated
      if (cleanUpdateData.date || cleanUpdateData.time) {
        const appointment = await mongoService.findById(this.collectionName, id);
        if (!appointment) {
          throw new Error('Appointment not found');
        }

        const conflictFilter = {
          _id: { $ne: mongoService.createObjectId(id) },
          userId: appointment.userId,
          date: cleanUpdateData.date || appointment.date,
          time: cleanUpdateData.time || appointment.time,
          status: { $in: ['scheduled', 'confirmed'] }
        };
        
        const existingAppointment = await mongoService.findOne(this.collectionName, conflictFilter);
        if (existingAppointment) {
          throw new Error('User already has an appointment at this date and time');
        }
      }

      // Update appointment
      const result = await mongoService.findOneAndUpdate(
        this.collectionName,
        { _id: mongoService.createObjectId(id) },
        { $set: cleanUpdateData }
      );

      if (!result) {
        throw new Error('Appointment not found');
      }

      return await this.findById(id);
    } catch (error) {
      throw new Error(`Failed to update appointment: ${error.message}`);
    }
  }

  // Delete appointment by ID
  static async deleteById(id) {
    try {
      const result = await mongoService.deleteById(this.collectionName, id);
      
      if (result.deletedCount === 0) {
        throw new Error('Appointment not found');
      }

      return { success: true, message: 'Appointment deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete appointment: ${error.message}`);
    }
  }

  // Get appointment statistics
  static async getStats() {
    try {
      const totalAppointments = await mongoService.countDocuments(this.collectionName);
      const scheduledAppointments = await mongoService.countDocuments(this.collectionName, { status: 'scheduled' });
      const confirmedAppointments = await mongoService.countDocuments(this.collectionName, { status: 'confirmed' });
      const completedAppointments = await mongoService.countDocuments(this.collectionName, { status: 'completed' });
      const cancelledAppointments = await mongoService.countDocuments(this.collectionName, { status: 'cancelled' });
      
      // Get today's appointments
      const today = new Date().toISOString().split('T')[0];
      const todayAppointments = await mongoService.countDocuments(this.collectionName, { date: today });
      
      // Get upcoming appointments (next 7 days)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const upcomingAppointments = await mongoService.countDocuments(this.collectionName, {
        date: {
          $gte: today,
          $lte: nextWeek.toISOString().split('T')[0]
        },
        status: { $in: ['scheduled', 'confirmed'] }
      });

      return {
        totalAppointments,
        scheduledAppointments,
        confirmedAppointments,
        completedAppointments,
        cancelledAppointments,
        todayAppointments,
        upcomingAppointments
      };
    } catch (error) {
      throw new Error(`Failed to get appointment statistics: ${error.message}`);
    }
  }
}

module.exports = AppointmentModel;