// server/services/pdfGenerator.js
import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import path from 'path';
import { promises as fs } from 'fs';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';

class PDFGenerator {
  constructor() {
    this.browser = null;
    this.initHandlebars();
    this.setupDirectories();
  }

  async setupDirectories() {
    const dirs = [
      './uploads/pdfs',
      './uploads/previews',
      './uploads/templates',
      './logs/pdf'
    ];
    
    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        console.error(`Failed to create directory ${dir}:`, error);
      }
    }
  }

  initHandlebars() {
    // Currency formatting
    Handlebars.registerHelper('formatCurrency', function(amount, currency = 'USD') {
      if (typeof amount !== 'number') amount = parseFloat(amount) || 0;
      
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      
      return formatter.format(amount);
    });

    // Date formatting helper (native JS, no moment needed)
    const formatDate = (date, format = 'DD/MM/YYYY') => {
      if (!date) return '';
      const d = new Date(date);
      if (isNaN(d.getTime())) return date;
      
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      
      return format
        .replace('DD', day)
        .replace('MM', month)
        .replace('YYYY', year)
        .replace('HH', hours)
        .replace('mm', minutes);
    };

    // Date formatting
    Handlebars.registerHelper('formatDate', function(date, format = 'DD/MM/YYYY') {
      if (!date) return '';
      return formatDate(date, format);
    });

    // Calculate total
    Handlebars.registerHelper('calculateTotal', function(items) {
      return items.reduce((total, item) => {
        const quantity = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.unitPrice) || 0;
        const discount = parseFloat(item.discount) || 0;
        const itemTotal = quantity * price;
        return total + (itemTotal - (itemTotal * discount / 100));
      }, 0);
    });

    // Calculate subtotal
    Handlebars.registerHelper('calculateSubtotal', function(items) {
      return items.reduce((total, item) => {
        const quantity = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.unitPrice) || 0;
        return total + (quantity * price);
      }, 0);
    });

    // Calculate tax
    Handlebars.registerHelper('calculateTax', function(subtotal, taxRate) {
      const rate = parseFloat(taxRate) || 0;
      return (subtotal * rate) / 100;
    });

    // Amount in words (fallback - returns formatted number)
    Handlebars.registerHelper('amountInWords', function(amount) {
      if (!amount) return '';
      const num = parseFloat(amount);
      return isNaN(num) ? amount : `${num.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    });

    // If condition helper
    Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
      return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
    });

    // Unless equals
    Handlebars.registerHelper('unlessEquals', function(arg1, arg2, options) {
      return (arg1 !== arg2) ? options.fn(this) : options.inverse(this);
    });

    // Greater than
    Handlebars.registerHelper('gt', function(arg1, arg2, options) {
      return (arg1 > arg2) ? options.fn(this) : options.inverse(this);
    });

    // Less than
    Handlebars.registerHelper('lt', function(arg1, arg2, options) {
      return (arg1 < arg2) ? options.fn(this) : options.inverse(this);
    });

    // Format number
    Handlebars.registerHelper('formatNumber', function(number, decimals = 2) {
      return parseFloat(number).toFixed(decimals);
    });

    // Truncate text
    Handlebars.registerHelper('truncate', function(str, len) {
      if (str.length > len) {
        return str.substring(0, len) + '...';
      }
      return str;
    });

    // Add commas to numbers
    Handlebars.registerHelper('addCommas', function(number) {
      return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    });

    // Uppercase
    Handlebars.registerHelper('uppercase', function(str) {
      return str ? str.toUpperCase() : '';
    });

    // Lowercase
    Handlebars.registerHelper('lowercase', function(str) {
      return str ? str.toLowerCase() : '';
    });

    // Capitalize
    Handlebars.registerHelper('capitalize', function(str) {
      return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
    });

    // Times (for loops)
    Handlebars.registerHelper('times', function(n, block) {
      let accum = '';
      for(let i = 0; i < n; ++i) {
        accum += block.fn(i);
      }
      return accum;
    });

    // JSON stringify
    Handlebars.registerHelper('json', function(obj) {
      return JSON.stringify(obj);
    });
  }

  async getBrowser() {
    if (!this.browser) {
      const launchOptions = {
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process'
        ]
      };

      // In production, use installed chromium
      if (process.env.NODE_ENV === 'production') {
        launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser';
      }

      this.browser = await puppeteer.launch(launchOptions);
    }
    return this.browser;
  }

  async generatePDF(template, data, options = {}) {
    let page = null;
    try {
      // Prepare data with calculations
      const preparedData = await this.prepareData(template, data, options);
      
      // Compile template
      const compiledHTML = await this.compileTemplate(template, preparedData);
      
      // Generate PDF
      const browser = await this.getBrowser();
      page = await browser.newPage();
      
      // Set viewport
      await page.setViewport({
        width: template.settings.orientation === 'landscape' ? 1240 : 876,
        height: 1240,
        deviceScaleFactor: 2
      });
      
      // Set content
      await page.setContent(compiledHTML, { waitUntil: 'networkidle0' });
      
      // Generate PDF
      const pdfOptions = {
        format: template.settings.pageSize || 'A4',
        printBackground: true,
        margin: {
          top: `${template.settings.margins?.top || 50}px`,
          right: `${template.settings.margins?.right || 20}px`,
          bottom: `${template.settings.margins?.bottom || 50}px`,
          left: `${template.settings.margins?.left || 20}px`
        },
        displayHeaderFooter: template.settings.header?.enabled || template.settings.footer?.enabled,
        headerTemplate: template.settings.header?.enabled ? await this.generateHeaderFooter('header', template, preparedData) : '',
        footerTemplate: template.settings.footer?.enabled ? await this.generateHeaderFooter('footer', template, preparedData) : ''
      };

      const pdfBuffer = await page.pdf(pdfOptions);
      
      // Add watermark if enabled
      let finalPdfBuffer = pdfBuffer;
      if (template.settings.watermark?.enabled) {
        finalPdfBuffer = await this.addWatermark(pdfBuffer, template.settings.watermark);
      }
      
      // Save to file
      const filename = this.generateFilename(template, data, options);
      const filePath = path.join('uploads', 'pdfs', filename);
      
      await fs.writeFile(filePath, finalPdfBuffer);
      
      // Generate thumbnail for preview
      const thumbnailPath = await this.generateThumbnail(page, template._id.toString());
      
      return {
        buffer: finalPdfBuffer,
        filename,
        filePath,
        url: `/api/download/pdfs/${filename}`,
        thumbnail: thumbnailPath,
        size: finalPdfBuffer.length,
        pages: await this.getPageCount(finalPdfBuffer)
      };
      
    } catch (error) {
      console.error('PDF Generation Error:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    } finally {
      if (page) await page.close();
    }
  }

  async compileTemplate(template, data) {
    // Compile main template
    const compiledTemplate = Handlebars.compile(template.htmlContent);
    const htmlContent = compiledTemplate(data);
    
    // Create full HTML document
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${template.name}</title>
        <style>
          /* Base styles */
          body {
            font-family: ${template.metadata?.fontFamily || 'Arial, sans-serif'};
            font-size: ${template.metadata?.fontSize || 12}px;
            color: ${template.metadata?.primaryColor || '#000000'};
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Page breaks */
          .page-break {
            page-break-before: always;
          }
          
          .avoid-break {
            page-break-inside: avoid;
          }
          
          /* Table styles */
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
          }
          
          th {
            background-color: ${template.metadata?.accentColor || '#2196F3'};
            color: white;
            padding: 8px;
            text-align: left;
          }
          
          td {
            padding: 8px;
            border-bottom: 1px solid #ddd;
          }
          
          /* Utility classes */
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .bold { font-weight: bold; }
          .italic { font-style: italic; }
          .underline { text-decoration: underline; }
          
          /* Custom CSS from template */
          ${template.cssContent || ''}
          
          /* Print styles */
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
            .page-break { page-break-before: always; }
          }
        </style>
        ${template.javascriptContent ? `<script>${template.javascriptContent}</script>` : ''}
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;
  }

  async prepareData(template, data, options) {
    // Ensure all template variables have values
    const templateData = { ...data };
    
    template.variables?.forEach(variable => {
      if (!templateData[variable.key] && variable.defaultValue !== undefined) {
        templateData[variable.key] = variable.defaultValue;
      }
    });
    
    // Add system variables
    templateData._system = {
      generatedAt: new Date(),
      pageNumber: 1,
      totalPages: 1,
      printId: this.generatePrintId(),
      qrCode: await this.generateQRCode(data)
    };
    
    // Add calculations
    templateData._calculations = await this.calculateValues(templateData);
    
    return templateData;
  }

  async generateHeaderFooter(type, template, data) {
    const style = `
      <style>
        .${type} {
          font-size: 10px;
          color: #666;
          width: 100%;
          ${type === 'header' ? 'top: 0;' : 'bottom: 0;'}
          height: ${template.settings[type]?.height || (type === 'header' ? '100px' : '80px')};
          text-align: center;
          padding: 10px;
        }
        .page-number {
          float: right;
        }
        .total-pages {
          float: left;
        }
      </style>
    `;
    
    const content = type === 'header' 
      ? `<div>${template.name} | ${data.company?.name || 'CRM'}</div>`
      : `<div class="page-number">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`;
    
    return `<div class="${type}">${style}${content}</div>`;
  }

  async generateThumbnail(page, templateId) {
    try {
      const thumbnail = await page.screenshot({
        type: 'jpeg',
        quality: 70,
        clip: { x: 0, y: 0, width: 300, height: 400 }
      });
      
      const filename = `thumb_${templateId}_${Date.now()}.jpg`;
      const filePath = path.join('uploads', 'previews', filename);
      
      await fs.writeFile(filePath, thumbnail);
      return `/api/download/previews/${filename}`;
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      return null;
    }
  }

  async addWatermark(pdfBuffer, watermarkSettings) {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pages = pdfDoc.getPages();
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      pages.forEach(page => {
        const { width, height } = page.getSize();
        
        page.drawText(watermarkSettings.text || 'CONFIDENTIAL', {
          x: width / 2,
          y: height / 2,
          size: 48,
          font: helveticaFont,
          color: rgb(0.5, 0.5, 0.5),
          opacity: watermarkSettings.opacity || 0.1,
          rotate: { type: 'degrees', angle: 45 }
        });
      });
      
      return await pdfDoc.save();
    } catch (error) {
      console.error('Watermark addition failed:', error);
      return pdfBuffer; // Return original if watermark fails
    }
  }

  async generateQRCode(data) {
    try {
      const qrData = JSON.stringify({
        documentId: data.quotation?.number || data.invoice?.number,
        date: new Date().toISOString(),
        total: data.quotation?.total || data.invoice?.total
      });
      
      return await QRCode.toDataURL(qrData, { width: 100 });
    } catch (error) {
      return null;
    }
  }

  async getPageCount(pdfBuffer) {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      return pdfDoc.getPageCount();
    } catch {
      return 1;
    }
  }

  generateFilename(template, data, options) {
    const timestamp = Date.now();
    const docNumber = data.quotation?.number || data.invoice?.number || timestamp;
    const safeName = template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return `${safeName}_${docNumber}_${timestamp}.pdf`;
  }

  generatePrintId() {
    return `PRINT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async calculateValues(data) {
    const subtotal = data.items?.reduce((sum, item) => {
      return sum + ((item.quantity || 0) * (item.unitPrice || 0));
    }, 0) || 0;
    
    const discount = data.quotation?.discount || data.invoice?.discount || 0;
    const taxRate = data.quotation?.taxRate || data.invoice?.taxRate || 0;
    
    const discountAmount = (subtotal * discount) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * taxRate) / 100;
    const total = taxableAmount + taxAmount;
    
    return {
      subtotal,
      discount,
      discountAmount,
      taxableAmount,
      taxRate,
      taxAmount,
      total,
      amountInWords: this.numberToWords(total)
    };
  }

  numberToWords(num) {
    // Simple implementation - you might want to use a library
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero';
    
    // For simplicity, returning basic conversion
    return `$${num.toFixed(2)} only`;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export default new PDFGenerator();