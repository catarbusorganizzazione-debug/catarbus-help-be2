const mongoService = require('../services/mongoService');

class PatternModel {
  static collectionName = 'patterns';

  static async validatePattern(sequence) {
    try {
      const cleaned = String(sequence ?? '').replace(/[^01]/g, '');

      if (!cleaned) {
        return { success: true, cleaned, matched: false, message: [] };
      }

      const filter = { sequence: cleaned };

      const patterns = await mongoService.findAll(this.collectionName, filter, {
        limit: 1
      });

      const pattern = Array.isArray(patterns) && patterns.length > 0 ? patterns[0] : null;

      if (!pattern) {
        return { success: true, cleaned, matched: false, message: [] };
      }

      return {
        success: true,
        cleaned,
        matched: true,
        message: Array.isArray(pattern.message) ? pattern.message : [],
        _id: pattern._id,
        sequence: pattern.sequence
      };
    } catch (error) {
      throw new Error(`Failed to fetch patterns: ${error.message}`);
    }
  }
}

module.exports = PatternModel;
