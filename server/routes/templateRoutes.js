// server/routes/templateRoutes.js
import express from 'express';
import { auth, requireAuth } from '../middleware/auth.js';
import templateController from '../controllers/templateController.js';

const router = express.Router();

// ========================================
// PUBLIC ROUTES (Optional Authentication)
// ========================================

/**
 * @route   GET /api/templates
 * @desc    Get all templates with filtering and pagination
 * @param   {string} type - Template type (quotation, invoice, etc.)
 * @param   {string} category - Template category
 * @param   {string} search - Search in name/description
 * @param   {number} page - Page number (default: 1)
 * @param   {number} limit - Items per page (default: 20)
 * @param   {string} sortBy - Sort field (default: updatedAt)
 * @param   {string} sortOrder - asc or desc (default: desc)
 * @param   {string} userId - Filter by creator
 * @param   {boolean} onlyPublic - Show only public templates
 * @param   {boolean} onlyFavorites - Show only favorite templates (requires auth)
 */
router.get('/', auth, templateController.getTemplates.bind(templateController));

/**
 * @route   GET /api/templates/:id
 * @desc    Get single template by ID
 */
router.get('/:id', auth, templateController.getTemplate.bind(templateController));

// ========================================
// PROTECTED ROUTES (Requires Authentication)
// ========================================

/**
 * @route   POST /api/templates
 * @desc    Create new template
 * @body    {string} name - Template name (required)
 * @body    {string} type - Template type (required)
 * @body    {string} category - Template category
 * @body    {string} htmlContent - HTML content (required)
 * @body    {string} cssContent - CSS content
 * @body    {string} javascriptContent - JavaScript content
 * @body    {object} settings - Template settings (page size, margins, etc.)
 * @body    {array} variables - Template variables
 * @body    {array} tags - Tags for organization
 * @body    {boolean} isPublic - Make template public
 * @body    {boolean} isDefault - Set as default for type
 */
router.post('/', requireAuth, templateController.createTemplate.bind(templateController));

/**
 * @route   PUT /api/templates/:id
 * @desc    Update template
 * @body    {string} name - Template name
 * @body    {string} description - Template description
 * @body    {string} htmlContent - HTML content
 * @body    {string} cssContent - CSS content
 * @body    {object} settings - Update settings
 * @body    {boolean} isPublic - Update public status
 */
router.put('/:id', requireAuth, templateController.updateTemplate.bind(templateController));

/**
 * @route   DELETE /api/templates/:id
 * @desc    Soft delete template
 */
router.delete('/:id', requireAuth, templateController.deleteTemplate.bind(templateController));

/**
 * @route   POST /api/templates/:id/duplicate
 * @desc    Duplicate template
 * @body    {string} name - Name for duplicated template (optional)
 */
router.post('/:id/duplicate', requireAuth, templateController.duplicateTemplate.bind(templateController));

/**
 * @route   POST /api/templates/:id/default
 * @desc    Set template as default for its type
 */
router.post('/:id/default', requireAuth, templateController.setDefaultTemplate.bind(templateController));

/**
 * @route   GET /api/templates/:id/versions
 * @desc    Get all versions of a template
 */
router.get('/:id/versions', auth, templateController.getTemplateVersions.bind(templateController));

/**
 * @route   POST /api/templates/:id/versions/:version/restore
 * @desc    Restore a specific template version
 */
router.post('/:id/versions/:version/restore', requireAuth, templateController.restoreVersion.bind(templateController));

/**
 * @route   POST /api/templates/:id/favorite
 * @desc    Toggle template as favorite
 */
router.post('/:id/favorite', requireAuth, templateController.toggleFavorite.bind(templateController));

/**
 * @route   POST /api/templates/preview
 * @desc    Generate template preview PDF
 * @body    {string} templateId - Template ID (required)
 * @body    {object} data - Sample data for template variables
 */
router.post('/generate/preview', requireAuth, templateController.previewTemplate.bind(templateController));

/**
 * @route   POST /api/templates/generate
 * @desc    Generate PDF from template with data
 * @body    {string} templateId - Template ID (required)
 * @body    {object} data - Data for template variables and document info
 * @body    {object} options - Additional options (sendEmail, recipientEmail, etc.)
 */
router.post('/generate/pdf', requireAuth, templateController.generatePDF.bind(templateController));

/**
 * @route   GET /api/templates/:id/analytics
 * @desc    Get template analytics
 * @param   {string} period - Time period (30d, 90d, 1y, all)
 */
router.get('/:id/analytics', requireAuth, templateController.getTemplateAnalytics.bind(templateController));

/**
 * @route   GET /api/templates/:id/export
 * @desc    Export template
 * @param   {string} format - Export format (json, html)
 */
router.get('/:id/export', requireAuth, templateController.exportTemplate.bind(templateController));

/**
 * @route   POST /api/templates/import
 * @desc    Import template from JSON/HTML
 * @body    {string} format - Import format (json, html)
 * @body    {string} name - Template name
 * @body    {string} type - Template type
 * @body    {string} description - Template description
 * @body    {object} data - Template data or file content
 * @body    {boolean} isPublic - Make imported template public
 * @body    {array} tags - Template tags
 */
router.post('/import/upload', requireAuth, templateController.importTemplate.bind(templateController));

// ========================================
// SPECIAL ROUTES
// ========================================

/**
 * @route   POST /api/documents/:docId/print
 * @desc    Generate PDF for a document (quotation, invoice, etc.) using template
 * @body    {string} templateId - Template to use (optional, uses default if not provided)
 * @body    {string} documentType - Document type (quotation, invoice, etc.)
 * @body    {boolean} sendEmail - Send generated PDF via email
 * @body    {string} recipientEmail - Email recipient
 * @body    {object} emailOptions - Email subject and body
 * @body    {object} printSettings - Print settings
 */
router.post('/documents/:docId/print', requireAuth, templateController.generatePDF.bind(templateController));

export default router;