// server/models/Template.js
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const templateSchema = new Schema({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  description: {
    type: String,
    trim: true
  },
  type: { 
    type: String, 
    enum: ['quotation', 'invoice', 'proforma-invoice', 'purchase-order', 'delivery-challan', 'receipt'],
    default: 'quotation',
    index: true
  },
  category: {
    type: String,
    enum: ['standard', 'professional', 'minimal', 'modern', 'custom'],
    default: 'standard'
  },
  htmlContent: { 
    type: String, 
    required: true 
  },
  cssContent: { 
    type: String, 
    default: '' 
  },
  javascriptContent: {
    type: String,
    default: ''
  },
  thumbnail: {
    type: String,
    default: ''
  },
  isActive: { 
    type: Boolean, 
    default: true,
    index: true
  },
  isDefault: { 
    type: Boolean, 
    default: false 
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  version: {
    type: Number,
    default: 1
  },
  settings: {
    pageSize: { 
      type: String, 
      enum: ['A4', 'A3', 'Letter', 'Legal', 'A5'],
      default: 'A4' 
    },
    orientation: { 
      type: String, 
      enum: ['portrait', 'landscape'], 
      default: 'portrait' 
    },
    margins: {
      top: { type: Number, default: 50, min: 0, max: 200 },
      right: { type: Number, default: 20, min: 0, max: 200 },
      bottom: { type: Number, default: 50, min: 0, max: 200 },
      left: { type: Number, default: 20, min: 0, max: 200 }
    },
    header: {
      enabled: { type: Boolean, default: true },
      height: { type: Number, default: 100 },
      repeatOnEachPage: { type: Boolean, default: true }
    },
    footer: {
      enabled: { type: Boolean, default: true },
      height: { type: Number, default: 80 },
      repeatOnEachPage: { type: Boolean, default: true }
    },
    watermark: {
      enabled: { type: Boolean, default: false },
      text: { type: String, default: 'CONFIDENTIAL' },
      opacity: { type: Number, default: 0.1, min: 0, max: 1 }
    }
  },
  variables: [{
    key: { 
      type: String, 
      required: true,
      trim: true
    },
    label: { 
      type: String, 
      required: true 
    },
    type: { 
      type: String, 
      enum: ['text', 'number', 'date', 'currency', 'boolean', 'image', 'array', 'object'],
      default: 'text'
    },
    defaultValue: Schema.Types.Mixed,
    required: { type: Boolean, default: false },
    validation: {
      min: Number,
      max: Number,
      pattern: String,
      options: [String]
    },
    placeholder: String,
    helpText: String
  }],
  conditions: [{
    name: String,
    expression: String,
    sections: [String],
    action: {
      type: String,
      enum: ['show', 'hide', 'highlight']
    }
  }],
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  updatedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  },
  lastUsed: {
    type: Date
  },
  usageCount: { 
    type: Number, 
    default: 0 
  },
  printCount: {
    type: Number,
    default: 0
  },
  favorites: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  metadata: {
    fontFamily: { type: String, default: 'Arial, sans-serif' },
    fontSize: { type: Number, default: 12 },
    primaryColor: { type: String, default: '#000000' },
    secondaryColor: { type: String, default: '#666666' },
    accentColor: { type: String, default: '#2196F3' }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full URL
templateSchema.virtual('thumbnailUrl').get(function() {
  if (this.thumbnail) {
    return `${process.env.BASE_URL}/uploads/templates/${this.thumbnail}`;
  }
  return null;
});

// Pre-save middleware
templateSchema.pre('save', function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    // This will be handled in the controller
  }
  next();
});

// Indexes
templateSchema.index({ type: 1, isActive: 1, isDefault: 1 });
templateSchema.index({ createdBy: 1, isActive: 1 });
templateSchema.index({ tags: 1 });
templateSchema.index({ category: 1 });

// Static methods
templateSchema.statics.findByType = function(type) {
  return this.find({ type, isActive: true }).sort({ isDefault: -1, name: 1 });
};

templateSchema.statics.getDefaultTemplate = function(type) {
  return this.findOne({ type, isDefault: true, isActive: true });
};

// Instance methods
templateSchema.methods.incrementUsage = async function() {
  this.usageCount += 1;
  this.lastUsed = new Date();
  return this.save();
};

templateSchema.methods.getVariablesMap = function() {
  const map = {};
  this.variables.forEach(variable => {
    map[variable.key] = {
      ...variable.toObject(),
      value: variable.defaultValue
    };
  });
  return map;
};

export default mongoose.model('Template', templateSchema);