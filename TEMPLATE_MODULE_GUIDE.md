# Template Module - Implementation Guide

## Overview
A comprehensive template management system for the CRM application that allows users to create, manage, and use templates for generating PDFs (quotations, invoices, etc.).

## Files Created/Modified

### Models
1. **[Templates.js](server/models/Templates.js)** - Main Template Model
   - Stores template definitions with HTML/CSS content
   - Supports variables, conditions, and settings
   - Tracks usage count and last used date
   - Methods for version management

2. **[TemplateHistory.js](server/models/TemplateHistory.js)** - Version History
   - Maintains version history of templates
   - Tracks changes between versions
   - Enables template restoration

3. **[TemplateFavorite.js](server/models/TemplateFavorite.js)** - User Favorites
   - Manages favorite templates per user
   - Unique constraint on templateId + userId
   - Tracks when template was marked as favorite

4. **[PrintHistory.js](server/models/PrintHistory.js)** - Audit Trail
   - Logs all PDF generations
   - Tracks delivery (email sent, downloads)
   - Client information (IP, browser, OS)
   - TTL index for automatic cleanup after 90 days

### Controllers
1. **[templateController.js](server/controllers/templateController.js)** - Main Business Logic
   
   **Methods:**
   - `getTemplates()` - List all templates with filtering, pagination, search
   - `getTemplate()` - Get single template details
   - `createTemplate()` - Create new template
   - `updateTemplate()` - Update existing template
   - `deleteTemplate()` - Soft delete template
   - `duplicateTemplate()` - Clone template with new name
   - `setDefaultTemplate()` - Set as default for type
   - `getTemplateVersions()` - Get version history
   - `restoreVersion()` - Restore to previous version
   - `previewTemplate()` - Generate preview PDF
   - `generatePDF()` - Generate final PDF with data
   - `getTemplateAnalytics()` - Usage analytics
   - `toggleFavorite()` - Add/remove favorite
   - `exportTemplate()` - Export as JSON/HTML
   - `importTemplate()` - Import from JSON/HTML
   - `getBrowserInfo()` - Parse browser from user agent
   - `getOSInfo()` - Parse OS from user agent

### Routes
1. **[templateRoutes.js](server/routes/templateRoutes.js)** - API Endpoints

   **Public Routes (Optional Auth):**
   ```
   GET    /api/templates              - List all templates
   GET    /api/templates/:id          - Get template details
   GET    /api/templates/:id/versions - Get version history
   ```

   **Protected Routes (Requires Auth):**
   ```
   POST   /api/templates              - Create template
   PUT    /api/templates/:id          - Update template
   DELETE /api/templates/:id          - Delete template
   POST   /api/templates/:id/duplicate - Clone template
   POST   /api/templates/:id/default  - Set as default
   POST   /api/templates/:id/versions/:version/restore - Restore version
   POST   /api/templates/:id/favorite - Toggle favorite
   POST   /api/templates/generate/preview - Preview PDF
   POST   /api/templates/generate/pdf - Generate PDF
   GET    /api/templates/:id/analytics - Usage analytics
   GET    /api/templates/:id/export   - Export template
   POST   /api/templates/import/upload - Import template
   ```

### Middleware
1. **[auth.js](server/middleware/auth.js)** - Authentication
   - `auth()` - Optional authentication middleware
   - `requireAuth()` - Required authentication middleware
   - JWT token verification

### Dependencies Required
- `jsonwebtoken` - For JWT auth
- `express` - Web framework
- `mongoose` - MongoDB driver
- `pdfkit` or similar - PDF generation (already exists)
- `nodemailer` or similar - Email sending (already exists)

## Query Parameters & Features

### Filtering
- `type` - Template type (quotation, invoice, etc.)
- `category` - Template category (standard, professional, etc.)
- `search` - Search in name/description
- `userId` - Filter by creator
- `onlyPublic` - Show only public templates
- `onlyFavorites` - Show only favorited templates

### Pagination
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `sortBy` - Sort field (default: updatedAt)
- `sortOrder` - asc or desc (default: desc)

### PDF Generation Options
```javascript
{
  templateId: "...",
  data: {
    id: "...",
    type: "quotation",
    // template variables
  },
  options: {
    documentType: "Quotation",
    sendEmail: true,
    recipientEmail: "customer@example.com",
    emailOptions: {
      subject: "Your Quotation",
      body: "Please find attached..."
    },
    printSettings: {
      pageSize: "A4",
      orientation: "portrait",
      quality: "high"
    }
  }
}
```

## Security Features
- User authentication required for sensitive operations
- Permission checks (users can only modify their own templates)
- Public/Private template access control
- Soft deletes (templates marked inactive, not removed)
- Input validation on all endpoints
- Error handling with appropriate HTTP status codes

## Best Practices Implemented

### Code Quality
- Consistent async/await usage
- Proper error handling with try-catch
- Input validation before DB operations
- Meaningful error messages
- Consistent naming conventions

### Database
- Proper indexing for common queries
- Foreign key references with population
- TTL indexes for audit cleanup
- Transaction support where applicable
- Schema validation

### API Design
- RESTful endpoint structure
- Consistent HTTP status codes
- Pagination support
- Filtering and search capabilities
- Proper request/response structure

### Permissions
- Creator-based ownership
- Public/private access control
- Role-based access (can be extended)
- User isolation

## Integration Points

### With Existing System
- Uses existing User model for authentication
- Integrates with pdfGenerator service
- Integrates with emailService for sending
- Compatible with Quotation, Invoice, Order models

### Usage Example
```javascript
// Create a template
POST /api/templates
{
  "name": "Standard Quotation",
  "type": "quotation",
  "category": "professional",
  "htmlContent": "<html>...</html>",
  "cssContent": "body { font-family: Arial; }",
  "settings": {
    "pageSize": "A4",
    "orientation": "portrait",
    "margins": { "top": 50, "right": 20, "bottom": 50, "left": 20 }
  },
  "variables": [
    {
      "key": "companyName",
      "label": "Company Name",
      "type": "text",
      "required": true
    }
  ],
  "tags": ["quotation", "professional"]
}

// Generate PDF
POST /api/templates/generate/pdf
{
  "templateId": "507f1f77bcf86cd799439011",
  "data": {
    "id": "quotation_123",
    "type": "quotation",
    "companyName": "Acme Corp"
  },
  "options": {
    "sendEmail": true,
    "recipientEmail": "customer@example.com"
  }
}
```

## Environment Variables Needed
```env
JWT_SECRET=your-secret-key
BASE_URL=http://localhost:5000
NODE_ENV=development
```

## Future Enhancements
1. Template sharing between users
2. Template marketplace
3. Advanced analytics dashboard
4. Scheduled template generation
5. Template versioning with diffs
6. Batch PDF generation
7. Template validation
8. Custom CSS/JS sandboxing
9. Template inheritance
10. Multi-language support

## Error Handling
All endpoints return appropriate HTTP status codes:
- `200 OK` - Successful GET
- `201 Created` - Successful POST
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing auth
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Notes
- All dates are stored in ISO 8601 format
- File paths are relative to project root
- PDF files are stored in `/uploads/pdfs/`
- Templates use soft deletes (isActive field)
- User IDs reference MongoDB ObjectId format
