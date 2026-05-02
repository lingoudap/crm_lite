// server/models/TemplateFavorite.js
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const templateFavoriteSchema = new Schema({
  templateId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Template', 
    required: true,
    index: true
  },
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  addedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Unique index: a user can only favorite a template once
templateFavoriteSchema.index({ templateId: 1, userId: 1 }, { unique: true });

export default mongoose.model('TemplateFavorite', templateFavoriteSchema);
