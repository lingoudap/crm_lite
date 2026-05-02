// server/services/templateService.js
import Template from '../models/Templates.js';
import TemplateHistory from '../models/TemplateHistory.js';
import TemplateFavorite from '../models/TemplateFavorite.js';
import PrintHistory from '../models/PrintHistory.js';
import { promises as fs } from 'fs';
import path from 'path';

class TemplateService {
  async createTemplate(templateData, userId) {
    try {
      // If setting as default, unset previous defaults of same type
      if (templateData.isDefault) {
        await Template.updateMany(
          { 
            type: templateData.type, 
            isDefault: true,
            isActive: true 
          },
          { isDefault: false }
        );
      }
      
      const template = new Template({
        ...templateData,
        createdBy: userId,
        updatedBy: userId
      });
      
      await template.save();
      
      // Create initial version history
      await this.createVersionHistory(template, userId, 'Initial version');
      
      return template;
    } catch (error) {
      throw new Error(`Failed to create template: ${error.message}`);
    }
  }
  
  async updateTemplate(templateId, updates, userId) {
    try {
      const template = await Template.findById(templateId);
      if (!template) {
        throw new Error('Template not found');
      }
      
      // Track changes for history
      const changes = [];
      for (const key in updates) {
        if (template[key] !== updates[key]) {
          changes.push({
            field: key,
            oldValue: template[key],
            newValue: updates[key]
          });
        }
      }
      
      // If setting as default, unset previous defaults
      if (updates.isDefault && updates.isDefault !== template.isDefault) {
        await Template.updateMany(
          { 
            type: template.type, 
            isDefault: true,
            isActive: true,
            _id: { $ne: templateId }
          },
          { isDefault: false }
        );
      }
      
      // Update template
      Object.assign(template, updates);
      template.updatedBy = userId;
      template.version += 1;
      
      await template.save();
      
      // Create version history if there are changes
      if (changes.length > 0) {
        await this.createVersionHistory(template, userId, 'Template updated', changes);
      }
      
      return template;
    } catch (error) {
      throw new Error(`Failed to update template: ${error.message}`);
    }
  }
  
  async createVersionHistory(template, userId, comment, changes = []) {
    try {
      const lastVersion = await TemplateHistory.findOne({ templateId: template._id })
        .sort({ version: -1 })
        .limit(1);
      
      const version = lastVersion ? lastVersion.version + 1 : 1;
      
      const history = new TemplateHistory({
        templateId: template._id,
        version,
        name: template.name,
        description: template.description,
        htmlContent: template.htmlContent,
        cssContent: template.cssContent,
        javascriptContent: template.javascriptContent,
        settings: template.settings,
        variables: template.variables,
        changes: changes.length > 0 ? changes : [{
          field: 'version',
          oldValue: version - 1,
          newValue: version,
          operation: 'modified'
        }],
        createdBy: userId
      });
      
      await history.save();
      return history;
    } catch (error) {
      console.error('Failed to create version history:', error);
    }
  }
  
  async restoreVersion(templateId, version, userId) {
    try {
      const template = await Template.findById(templateId);
      if (!template) {
        throw new Error('Template not found');
      }
      
      const versionToRestore = await TemplateHistory.findOne({
        templateId,
        version: parseInt(version)
      });
      
      if (!versionToRestore) {
        throw new Error('Version not found');
      }
      
      // Create backup of current version
      await this.createVersionHistory(template, userId, 'Backup before restore');
      
      // Restore from version
      template.name = versionToRestore.name;
      template.description = versionToRestore.description;
      template.htmlContent = versionToRestore.htmlContent;
      template.cssContent = versionToRestore.cssContent;
      template.javascriptContent = versionToRestore.javascriptContent;
      template.settings = versionToRestore.settings;
      template.variables = versionToRestore.variables;
      template.updatedBy = userId;
      template.version += 1;
      
      await template.save();
      
      // Create history entry for restore
      await this.createVersionHistory(template, userId, `Restored from version ${version}`, [{
        field: 'restored_from',
        oldValue: template.version - 1,
        newValue: version,
        operation: 'restored'
      }]);
      
      return template;
    } catch (error) {
      throw new Error(`Failed to restore version: ${error.message}`);
    }
  }
  
  async duplicateTemplate(templateId, userId, newName = null) {
    try {
      const template = await Template.findById(templateId);
      if (!template) {
        throw new Error('Template not found');
      }
      
      // Create duplicate
      const duplicateData = {
        ...template.toObject(),
        _id: undefined,
        name: newName || `${template.name} (Copy)`,
        isDefault: false,
        createdBy: userId,
        updatedBy: userId,
        usageCount: 0,
        printCount: 0,
        lastUsed: null,
        favorites: [],
        createdAt: undefined,
        updatedAt: undefined
      };
      
      const duplicate = new Template(duplicateData);
      await duplicate.save();
      
      // Create version history
      await this.createVersionHistory(duplicate, userId, 'Duplicated from template');
      
      return duplicate;
    } catch (error) {
      throw new Error(`Failed to duplicate template: ${error.message}`);
    }
  }
  
  async getTemplatesWithStats(filters = {}) {
    try {
      const query = { isActive: true };
      
      // Apply filters
      if (filters.type) query.type = filters.type;
      if (filters.category) query.category = filters.category;
      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } },
          { tags: { $regex: filters.search, $options: 'i' } }
        ];
      }
      if (filters.userId) query.createdBy = filters.userId;
      
      const templates = await Template.find(query)
        .populate('createdBy', 'name email avatar')
        .populate('updatedBy', 'name email')
        .sort({ isDefault: -1, updatedAt: -1 })
        .lean();
      
      // Get stats for each template
      for (const template of templates) {
        const stats = await PrintHistory.aggregate([
          { $match: { templateId: template._id } },
          {
            $group: {
              _id: null,
              totalPrints: { $sum: 1 },
              totalCopies: { $sum: '$printSettings.copies' },
              lastPrinted: { $max: '$printedAt' }
            }
          }
        ]);
        
        template.stats = stats[0] || {
          totalPrints: 0,
          totalCopies: 0,
          lastPrinted: null
        };
        
        // Check if user has favorited this template
        if (filters.currentUserId) {
          const favorite = await TemplateFavorite.findOne({
            templateId: template._id,
            userId: filters.currentUserId
          });
          template.isFavorite = !!favorite;
        }
      }
      
      return templates;
    } catch (error) {
      throw new Error(`Failed to get templates: ${error.message}`);
    }
  }
  
  async getTemplateAnalytics(templateId, period = '30d') {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 30);
      }
      
      const analytics = await PrintHistory.aggregate([
        {
          $match: {
            templateId: mongoose.Types.ObjectId(templateId),
            printedAt: { $gte: startDate, $lte: endDate },
            status: 'success'
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$printedAt" }
            },
            prints: { $sum: 1 },
            copies: { $sum: "$printSettings.copies" },
            uniqueUsers: { $addToSet: "$printedBy" }
          }
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            date: "$_id",
            prints: 1,
            copies: 1,
            uniqueUsers: { $size: "$uniqueUsers" },
            _id: 0
          }
        }
      ]);
      
      const summary = await PrintHistory.aggregate([
        {
          $match: {
            templateId: mongoose.Types.ObjectId(templateId),
            printedAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalPrints: { $sum: 1 },
            successfulPrints: {
              $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] }
            },
            failedPrints: {
              $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] }
            },
            totalCopies: { $sum: "$printSettings.copies" },
            avgCopies: { $avg: "$printSettings.copies" },
            uniqueUsers: { $addToSet: "$printedBy" },
            mostUsedBy: { $max: "$printedBy" }
          }
        }
      ]);
      
      const userStats = await PrintHistory.aggregate([
        {
          $match: {
            templateId: mongoose.Types.ObjectId(templateId),
            printedAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: "$printedBy",
            prints: { $sum: 1 },
            lastPrint: { $max: "$printedAt" }
          }
        },
        { $sort: { prints: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: "$user" },
        {
          $project: {
            userId: "$_id",
            userName: "$user.name",
            userEmail: "$user.email",
            prints: 1,
            lastPrint: 1,
            _id: 0
          }
        }
      ]);
      
      return {
        period: {
          start: startDate,
          end: endDate,
          days: period
        },
        dailyStats: analytics,
        summary: summary[0] || {
          totalPrints: 0,
          successfulPrints: 0,
          failedPrints: 0,
          totalCopies: 0,
          avgCopies: 0,
          uniqueUserCount: 0
        },
        topUsers: userStats
      };
    } catch (error) {
      throw new Error(`Failed to get template analytics: ${error.message}`);
    }
  }
  
  async exportTemplate(templateId, format = 'json') {
    try {
      const template = await Template.findById(templateId).lean();
      if (!template) {
        throw new Error('Template not found');
      }
      
      // Remove sensitive/internal fields
      delete template._id;
      delete template.__v;
      delete template.createdAt;
      delete template.updatedAt;
      delete template.usageCount;
      delete template.printCount;
      delete template.lastUsed;
      delete template.favorites;
      
      if (format === 'json') {
        return {
          template,
          exportInfo: {
            exportedAt: new Date(),
            version: '1.0',
            format: 'json'
          }
        };
      } else if (format === 'html') {
        // Export as standalone HTML file
        return `
<!DOCTYPE html>
<html>
<head>
  <title>${template.name}</title>
  <meta charset="UTF-8">
  <style>
    ${template.cssContent}
    
    .template-info {
      display: none;
    }
    
    @media print {
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="template-info" data-template-name="${template.name}" data-template-type="${template.type}"></div>
  ${template.htmlContent}
  
  <script>
    // Template variables
    const templateVariables = ${JSON.stringify(template.variables, null, 2)};
    
    // Fill variables function
    function fillTemplate(data) {
      const elements = document.querySelectorAll('[data-variable]');
      elements.forEach(element => {
        const varName = element.getAttribute('data-variable');
        if (data[varName] !== undefined) {
          element.textContent = data[varName];
        }
      });
    }
    
    // Auto-fill on load
    document.addEventListener('DOMContentLoaded', function() {
      // Check for data in URL
      const urlParams = new URLSearchParams(window.location.search);
      const templateData = urlParams.get('data');
      if (templateData) {
        try {
          fillTemplate(JSON.parse(decodeURIComponent(templateData)));
        } catch (e) {
          console.error('Failed to parse template data:', e);
        }
      }
    });
  </script>
</body>
</html>`;
      }
      
      throw new Error('Unsupported export format');
    } catch (error) {
      throw new Error(`Failed to export template: ${error.message}`);
    }
  }
  
  async importTemplate(importData, userId, options = {}) {
    try {
      let templateData;
      
      if (options.format === 'json') {
        templateData = importData.template;
      } else if (options.format === 'html') {
        // Parse HTML to extract template data
        // This is simplified - you'd need actual HTML parsing
        templateData = {
          name: options.name || 'Imported Template',
          type: options.type || 'quotation',
          htmlContent: importData.html || '',
          cssContent: importData.css || '',
          description: options.description || 'Imported template'
        };
      } else {
        throw new Error('Unsupported import format');
      }
      
      // Create template
      const template = await this.createTemplate({
        ...templateData,
        name: options.name || templateData.name,
        type: options.type || templateData.type,
        isPublic: options.isPublic || false,
        tags: options.tags || []
      }, userId);
      
      return template;
    } catch (error) {
      throw new Error(`Failed to import template: ${error.message}`);
    }
  }
  
  async toggleFavorite(templateId, userId) {
    try {
      const favorite = await TemplateFavorite.findOne({
        templateId,
        userId
      });
      
      if (favorite) {
        // Remove favorite
        await favorite.deleteOne();
        return { isFavorite: false };
      } else {
        // Add favorite
        await TemplateFavorite.create({
          templateId,
          userId,
          lastUsed: new Date()
        });
        return { isFavorite: true };
      }
    } catch (error) {
      throw new Error(`Failed to toggle favorite: ${error.message}`);
    }
  }
}

export default new TemplateService();