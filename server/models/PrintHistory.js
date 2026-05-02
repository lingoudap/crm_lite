// server/models/PrintHistory.js
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const printHistorySchema = new Schema({
  documentId: {
    type: Schema.Types.ObjectId,
    refPath: 'documentType',
    index: true
  },
  documentType: {
    type: String,
    enum: ['Quotation', 'Invoice', 'Order', 'FollowUp'],
    index: true
  },
  templateId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Template', 
    required: true,
    index: true
  },
  templateName: String,
  templateVersion: Number,
  generatedPdf: {
    filename: String,
    path: String,
    url: String,
    size: Number,
    pages: Number,
    mimeType: { type: String, default: 'application/pdf' }
  },
  printSettings: {
    pageSize: String,
    orientation: String,
    quality: String,
    colorMode: String
  },
  printedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  printedAt: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  delivery: {
    emailSent: { type: Boolean, default: false },
    emailTo: [String],
    emailSubject: String,
    emailSentAt: Date,
    downloadedAt: Date,
    downloadCount: { type: Number, default: 0 }
  },
  clientInfo: {
    ipAddress: String,
    userAgent: String,
    browser: String,
    os: String
  },
  notes: String,
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for common queries
printHistorySchema.index({ printedAt: -1 });
printHistorySchema.index({ documentId: 1, documentType: 1 });
printHistorySchema.index({ printedBy: 1, printedAt: -1 });
printHistorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

export default mongoose.model('PrintHistory', printHistorySchema);
