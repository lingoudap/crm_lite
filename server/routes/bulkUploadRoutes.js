import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Models
import Lead from '../models/Leads.js';
import Quotation from '../models/Quotation.js';
import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import FollowUp from '../models/FollowUp.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration
const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (!file.originalname.endsWith('.csv')) {
      cb(new Error('Only CSV files are allowed'));
    } else {
      cb(null, true);
    }
  },
});

// ============= MODULE CONFIGURATION =============
const moduleConfig = {
  lead: {
    name: 'Lead',
    model: Lead,
    required_fields: ['Name', 'Email', 'Phone'],
    all_fields: ['Name', 'Email', 'Phone', 'Company', 'Status', 'Source', 'Notes'],
  },
  quotation: {
    name: 'Quotation',
    model: Quotation,
    required_fields: ['QuotNo', 'CName', 'Amount'],
    all_fields: ['QuotNo', 'EnqRef', 'CName', 'Amount', 'Descr', 'Date'],
  },
  customer: {
    name: 'Customer',
    model: Customer,
    required_fields: ['Name', 'Email', 'Phone'],
    all_fields: ['Name', 'Email', 'Phone', 'Company', 'Address', 'City', 'State', 'ZipCode'],
  },
  order: {
    name: 'Order',
    model: Order,
    required_fields: ['OrderNo', 'CName', 'Amount'],
    all_fields: ['OrderNo', 'CName', 'Amount', 'Date', 'Status', 'Notes'],
  },
  followup: {
    name: 'Follow-Up',
    model: FollowUp,
    required_fields: ['LeadID', 'FollowUpDate'],
    all_fields: ['LeadID', 'FollowUpDate', 'Notes', 'Status', 'Priority'],
  },
};

// ============= BULK UPLOAD ENDPOINT =============
router.post('/bulk-upload/:module', upload.single('csvFile'), async (req, res) => {
  const selectedModule = req.params.module.toLowerCase();
  const filePath = req.file.path;

  // Validate module
  if (!moduleConfig[selectedModule]) {
    fs.unlinkSync(filePath);
    return res.status(400).json({ error: 'Invalid module selected.' });
  }

  const config = moduleConfig[selectedModule];
  let processed = 0;
  let failed = 0;
  let errors = [];
  let rows = [];

  try {
    // Parse CSV file
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        rows.push(row);
      })
      .on('end', async () => {
        try {
          // Process each row
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 2; // CSV row numbers (1-indexed + header)

            // Validate required fields
            const missing = config.required_fields.filter(
              (f) => !row[f] || (typeof row[f] === 'string' && row[f].trim() === '')
            );

            if (missing.length > 0) {
              failed++;
              errors.push(`Row ${rowNum}: Missing required fields: ${missing.join(', ')}`);
              continue;
            }

            // Validate email format
            if (row.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.Email)) {
              failed++;
              errors.push(`Row ${rowNum}: Invalid email format: ${row.Email}`);
              continue;
            }

            // Build object with valid fields
            const dataObject = {};
            config.all_fields.forEach((field) => {
              if (row[field] && row[field].trim() !== '') {
                dataObject[field] = row[field];
              }
            });

            // Auto-fill date if missing
            if (
              config.all_fields.includes('Date') &&
              (!dataObject.Date || dataObject.Date === '')
            ) {
              dataObject.Date = new Date().toISOString().split('T')[0];
            }
            if (
              config.all_fields.includes('FollowUpDate') &&
              (!dataObject.FollowUpDate || dataObject.FollowUpDate === '')
            ) {
              dataObject.FollowUpDate = new Date().toISOString().split('T')[0];
            }

            try {
              // Create and save document
              const newRecord = new config.model(dataObject);
              await newRecord.save();
              processed++;
            } catch (err) {
              failed++;
              errors.push(`Row ${rowNum}: ${err.message}`);
            }
          }

          // Clean up temporary file
          fs.unlinkSync(filePath);

          // Return success response
          return res.json({
            success: true,
            module: config.name,
            imported: processed,
            failed,
            errors: errors.slice(0, 100), // Limit errors to 100 for response size
          });
        } catch (err) {
          fs.unlinkSync(filePath);
          return res.status(500).json({
            error: 'Error processing file',
            details: err.message,
          });
        }
      })
      .on('error', (err) => {
        fs.unlinkSync(filePath);
        return res.status(400).json({
          error: 'Error parsing CSV file',
          details: err.message,
        });
      });
  } catch (err) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return res.status(500).json({
      error: 'Server error',
      details: err.message,
    });
  }
});

// ============= DOWNLOAD TEMPLATE ENDPOINT =============
router.get('/download-template/:module', (req, res) => {
  const selectedModule = req.params.module.toLowerCase();

  if (!moduleConfig[selectedModule]) {
    return res.status(400).json({ error: 'Invalid module selected.' });
  }

  const config = moduleConfig[selectedModule];
  const headers = config.all_fields.join(',');
  const filename = `${selectedModule}_template.csv`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(headers);
});

export default router;
