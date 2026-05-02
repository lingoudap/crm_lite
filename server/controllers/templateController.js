// server/controllers/templateController.js
import Template from '../models/Templates.js';
import TemplateHistory from '../models/TemplateHistory.js';
import TemplateFavorite from '../models/TemplateFavorite.js';
import PrintHistory from '../models/PrintHistory.js';
import templateService from '../services/templateService.js';
import pdfGenerator from '../services/pdfGenerator.js';
import emailService from '../services/emailService.js';

class TemplateController {
  // Get all templates
  async getTemplates(req, res) {
    try {
      const {
        type,
        category,
        search,
        page = 1,
        limit = 20,
        sortBy = 'updatedAt',
        sortOrder = 'desc',
        userId,
        onlyFavorites,
        onlyPublic
      } = req.query;
      
      const filters = {
        isActive: true
      };
      
      if (type) filters.type = type;
      if (category) filters.category = category;
      if (search) {
        filters.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }
      if (userId) filters.createdBy = userId;
      if (onlyPublic === 'true') filters.isPublic = true;
      
      let query = Template.find(filters).populate('createdBy', 'name email avatar');
      
      // Apply sorting
      const sortObject = {};
      sortObject[sortBy] = sortOrder === 'asc' ? 1 : -1;
      query = query.sort(sortObject);
      
      // Get total count before pagination
      const total = await Template.countDocuments(filters);
      
      // Apply pagination
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const startIndex = (pageNum - 1) * limitNum;
      query = query.skip(startIndex).limit(limitNum);
      
      let templates = await query.exec();
      
      // Add favorite status if user is authenticated
      if (req.user?.id) {
        const favorites = await TemplateFavorite.find({
          userId: req.user.id,
          templateId: { $in: templates.map(t => t._id) }
        });
        
        const favoriteIds = new Set(favorites.map(f => f.templateId.toString()));
        templates = templates.map(t => ({
          ...t.toObject(),
          isFavorite: favoriteIds.has(t._id.toString())
        }));
      }
      
      // Filter favorites if requested
      if (onlyFavorites === 'true' && req.user?.id) {
        templates = templates.filter(t => t.isFavorite);
      }
      
      res.json({
        templates,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasMore: startIndex + limitNum < total
      });
    } catch (error) {
      console.error('Get templates error:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  // Get template by ID
  async getTemplate(req, res) {
    try {
      const template = await Template.findById(req.params.id)
        .populate('createdBy', 'name email avatar')
        .populate('updatedBy', 'name email');
      
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      // Check if user has permission to view
      if (!template.isPublic && template.createdBy._id.toString() !== req.user?.id?.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      let templateData = template.toObject();
      
      // Check if template is favorite
      if (req.user?.id) {
        const favorite = await TemplateFavorite.findOne({
          templateId: template._id,
          userId: req.user.id
        });
        templateData.isFavorite = !!favorite;
      }
      
      res.json(templateData);
    } catch (error) {
      console.error('Get template error:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  // Create new template
  async createTemplate(req, res) {
    try {
      const templateData = req.body;
      
      // Validate required fields
      if (!templateData.name || !templateData.type) {
        return res.status(400).json({ 
          error: 'Name and type are required' 
        });
      }
      
      if (!templateData.htmlContent) {
        return res.status(400).json({ 
          error: 'HTML content is required' 
        });
      }
      
      // Check if template with same name exists for this user
      const existingTemplate = await Template.findOne({
        name: { $regex: `^${templateData.name}$`, $options: 'i' },
        type: templateData.type,
        createdBy: req.user.id,
        isActive: true
      });
      
      if (existingTemplate) {
        return res.status(400).json({
          error: 'A template with this name and type already exists'
        });
      }
      
      const template = await templateService.createTemplate(templateData, req.user.id);
      
      res.status(201).json({
        message: 'Template created successfully',
        template
      });
    } catch (error) {
      console.error('Create template error:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  // Update template
  async updateTemplate(req, res) {
    try {
      const template = await Template.findById(req.params.id);
      
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      // Check permissions
      if (template.createdBy.toString() !== req.user.id.toString()) {
        return res.status(403).json({ error: 'You can only edit your own templates' });
      }
      
      const updatedTemplate = await templateService.updateTemplate(
        req.params.id,
        req.body,
        req.user.id
      );
      
      res.json({
        message: 'Template updated successfully',
        template: updatedTemplate
      });
    } catch (error) {
      console.error('Update template error:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  // Delete template (soft delete)
  async deleteTemplate(req, res) {
    try {
      const template = await Template.findById(req.params.id);
      
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      // Check permissions
      if (template.createdBy.toString() !== req.user.id.toString()) {
        return res.status(403).json({ error: 'You can only delete your own templates' });
      }
      
      // Soft delete
      template.isActive = false;
      template.updatedBy = req.user.id;
      await template.save();
      
      res.json({
        message: 'Template deleted successfully'
      });
    } catch (error) {
      console.error('Delete template error:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  // Duplicate template
  async duplicateTemplate(req, res) {
    try {
      const { name } = req.body;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Template name is required' });
      }
      
      const duplicate = await templateService.duplicateTemplate(
        req.params.id,
        req.user.id,
        name
      );
      
      res.status(201).json({
        message: 'Template duplicated successfully',
        template: duplicate
      });
    } catch (error) {
      console.error('Duplicate template error:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  // Set as default template
  async setDefaultTemplate(req, res) {
    try {
      const template = await Template.findById(req.params.id);
      
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      // Check permissions
      if (template.createdBy.toString() !== req.user.id.toString()) {
        return res.status(403).json({ error: 'You can only set your own templates as default' });
      }
      
      // Unset previous default of same type
      await Template.updateMany(
        { 
          type: template.type, 
          isDefault: true,
          isActive: true,
          createdBy: req.user.id
        },
        { isDefault: false }
      );
      
      // Set new default
      template.isDefault = true;
      template.updatedBy = req.user.id;
      await template.save();
      
      res.json({
        message: 'Template set as default successfully',
        template
      });
    } catch (error) {
      console.error('Set default template error:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  // Get template versions
  async getTemplateVersions(req, res) {
    try {
      const template = await Template.findById(req.params.id);
      
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      // Check permissions
      if (template.createdBy.toString() !== req.user?.id?.toString() && !template.isPublic) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      const versions = await TemplateHistory.find({ templateId: req.params.id })
        .sort({ version: -1 })
        .populate('createdBy', 'name email');
      
      res.json({
        templateId: req.params.id,
        totalVersions: versions.length,
        versions
      });
    } catch (error) {
      console.error('Get versions error:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  // Restore template version
  async restoreVersion(req, res) {
    try {
      const { version } = req.params;
      
      const template = await Template.findById(req.params.id);
      
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      // Check permissions
      if (template.createdBy.toString() !== req.user.id.toString()) {
        return res.status(403).json({ error: 'You can only restore your own templates' });
      }
      
      const restoredTemplate = await templateService.restoreVersion(
        req.params.id,
        parseInt(version),
        req.user.id
      );
      
      res.json({
        message: `Template restored to version ${version} successfully`,
        template: restoredTemplate
      });
    } catch (error) {
      console.error('Restore version error:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  // Preview template
  async previewTemplate(req, res) {
    try {
      const { templateId, data } = req.body;
      
      if (!templateId || !data) {
        return res.status(400).json({ error: 'Template ID and data are required' });
      }
      
      const template = await Template.findById(templateId);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      // Check permissions
      if (!template.isPublic && template.createdBy.toString() !== req.user?.id?.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Generate preview
      const pdf = await pdfGenerator.generatePDF(template, data, { preview: true });
      
      if (!pdf || !pdf.buffer) {
        return res.status(500).json({ error: 'Failed to generate preview PDF' });
      }
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="preview.pdf"',
        'Content-Length': pdf.buffer.length
      });
      
      res.send(pdf.buffer);
    } catch (error) {
      console.error('Preview error:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  // Generate PDF
  async generatePDF(req, res) {
    try {
      const { templateId, data, options = {} } = req.body;
      
      if (!templateId || !data) {
        return res.status(400).json({ error: 'Template ID and data are required' });
      }
      
      const template = await Template.findById(templateId);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      // Check permissions
      if (!template.isPublic && template.createdBy.toString() !== req.user?.id?.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Generate PDF
      const pdf = await pdfGenerator.generatePDF(template, data, options);
      
      if (!pdf || !pdf.buffer) {
        return res.status(500).json({ error: 'Failed to generate PDF' });
      }
      
      // Update template usage
      template.usageCount = (template.usageCount || 0) + 1;
      template.lastUsed = new Date();
      await template.save();
      
      // Save print history
      const documentType = options.documentType || data.type || 'Other';
      const documentId = data.id || data._id;
      
      const printHistoryRecord = {
        documentId,
        documentType,
        templateId: template._id,
        templateName: template.name,
        templateVersion: template.version,
        generatedPdf: {
          filename: pdf.filename,
          path: pdf.filePath,
          url: pdf.url,
          size: pdf.size,
          pages: pdf.pages,
          mimeType: 'application/pdf'
        },
        printSettings: options.printSettings || {},
        printedBy: req.user?.id || null,
        printedAt: new Date(),
        clientInfo: {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          browser: this.getBrowserInfo(req.headers['user-agent']),
          os: this.getOSInfo(req.headers['user-agent'])
        }
      };
      
      const printHistory = await PrintHistory.create(printHistoryRecord);
      
      // Send email if requested
      if (options.sendEmail && options.recipientEmail) {
        try {
          const emailResult = await emailService.sendEmail({
            to: options.recipientEmail,
            subject: options.emailOptions?.subject || `${template.name} Generated`,
            body: options.emailOptions?.body || 'Please find the generated document attached.',
            attachments: [{
              filename: pdf.filename,
              content: pdf.buffer,
              contentType: 'application/pdf'
            }]
          });
          
          if (emailResult?.success) {
            await PrintHistory.findByIdAndUpdate(
              printHistory._id,
              { 
                $set: { 
                  'delivery.emailSent': true,
                  'delivery.emailTo': [options.recipientEmail],
                  'delivery.emailSubject': options.emailOptions?.subject,
                  'delivery.emailSentAt': new Date()
                }
              }
            );
          }
        } catch (emailError) {
          console.error('Email sending failed:', emailError);
          // Don't fail the entire request if email fails
        }
      }
      
      res.json({
        success: true,
        pdf: {
          url: pdf.url,
          filename: pdf.filename,
          size: pdf.size,
          pages: pdf.pages,
          thumbnail: pdf.thumbnail
        },
        message: 'PDF generated successfully'
      });
    } catch (error) {
      console.error('Generate PDF error:', error);
      res.status(500).json({ 
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
  
  // Get template analytics
  async getTemplateAnalytics(req, res) {
    try {
      const { period = '30d' } = req.query;
      
      const template = await Template.findById(req.params.id);
      
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      // Check permissions
      if (template.createdBy.toString() !== req.user?.id?.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      const analytics = await templateService.getTemplateAnalytics(
        req.params.id,
        period
      );
      
      res.json(analytics);
    } catch (error) {
      console.error('Get analytics error:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  // Toggle favorite
  async toggleFavorite(req, res) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'User must be authenticated' });
      }
      
      const template = await Template.findById(req.params.id);
      
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      const result = await templateService.toggleFavorite(
        req.params.id,
        req.user.id
      );
      
      res.json(result);
    } catch (error) {
      console.error('Toggle favorite error:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  // Export template
  async exportTemplate(req, res) {
    try {
      const { format = 'json' } = req.query;
      
      const template = await Template.findById(req.params.id);
      
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      // Check permissions
      if (template.createdBy.toString() !== req.user?.id?.toString() && !template.isPublic) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      const exportData = await templateService.exportTemplate(
        req.params.id,
        format
      );
      
      if (format === 'json') {
        res.json(exportData);
      } else if (format === 'html') {
        res.set({
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="template_${req.params.id}.html"`
        });
        res.send(exportData);
      } else {
        res.status(400).json({ error: 'Invalid format. Supported: json, html' });
      }
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  // Import template
  async importTemplate(req, res) {
    try {
      const { format, name, type, description, isPublic, tags } = req.body;
      const importData = req.body.data || req.file;
      
      if (!importData) {
        return res.status(400).json({ error: 'Import data is required' });
      }
      
      if (!name || !type) {
        return res.status(400).json({ error: 'Name and type are required' });
      }
      
      const template = await templateService.importTemplate(
        importData,
        req.user.id,
        { format, name, type, description, isPublic, tags }
      );
      
      res.status(201).json({
        message: 'Template imported successfully',
        template
      });
    } catch (error) {
      console.error('Import error:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  // Get browser info from user agent
  getBrowserInfo(userAgent) {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    
    return 'Unknown';
  }
  
  // Get OS info from user agent
  getOSInfo(userAgent) {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac OS')) return 'MacOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    
    return 'Unknown';
  }
}

export default new TemplateController();
