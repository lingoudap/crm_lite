// server/models/TemplateHistory.js
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const templateHistorySchema = new Schema({
  templateId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Template', 
    required: true,
    index: true
  },
  version: { 
    type: Number, 
    required: true 
  },
  name: String,
  description: String,
  htmlContent: String,
  cssContent: String,
  javascriptContent: String,
  settings: Schema.Types.Mixed,
  variables: Schema.Types.Mixed,
  changes: [{
    field: { type: String, required: true },
    oldValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed,
    operation: {
      type: String,
      enum: ['added', 'modified', 'removed']
    },
    timestamp: { type: Date, default: Date.now }
  }],
  restoreData: {
    restoredFrom: Number,
    restoredAt: Date,
    restoredBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
templateHistorySchema.index({ templateId: 1, version: -1 });
templateHistorySchema.index({ createdAt: -1 });

// Static methods
templateHistorySchema.statics.getLatestVersion = function(templateId) {
  return this.findOne({ templateId }).sort({ version: -1 }).limit(1);
};

templateHistorySchema.statics.getVersion = function(templateId, version) {
  return this.findOne({ templateId, version });
};

templateHistorySchema.statics.getAllVersions = function(templateId) {
  return this.find({ templateId }).sort({ version: -1 });
};

export default mongoose.model('TemplateHistory', templateHistorySchema);