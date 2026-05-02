// server/services/emailService.js
import nodemailer from 'nodemailer';
import { promises as fs } from 'fs';
import path from 'path';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  
  async sendQuotationEmail(customerEmail, quotationData, pdfBuffer, options = {}) {
    try {
      const subject = options.subject || `Quotation #${quotationData.number} from ${process.env.COMPANY_NAME}`;
      
      const mailOptions = {
        from: `"${process.env.COMPANY_NAME}" <${process.env.SMTP_FROM}>`,
        to: customerEmail,
        cc: options.cc || '',
        bcc: options.bcc || '',
        subject: subject,
        html: this.generateEmailTemplate(quotationData, options),
        attachments: [
          {
            filename: `Quotation_${quotationData.number}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      };
      
      // Add company logo if available
      if (options.includeLogo && process.env.COMPANY_LOGO_PATH) {
        try {
          const logoBuffer = await fs.readFile(process.env.COMPANY_LOGO_PATH);
          mailOptions.attachments.push({
            filename: 'logo.png',
            content: logoBuffer,
            contentType: 'image/png',
            cid: 'companylogo@crm'
          });
        } catch (error) {
          console.error('Failed to attach logo:', error);
        }
      }
      
      const info = await this.transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: info.messageId,
        response: info.response
      };
    } catch (error) {
      console.error('Email sending failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  generateEmailTemplate(quotationData, options) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #2196F3;
        }
        .company-logo {
            max-width: 200px;
            margin-bottom: 20px;
        }
        .content {
            margin: 20px 0;
        }
        .quotation-details {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .button {
            display: inline-block;
            background: #2196F3;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
            text-align: center;
        }
        .highlight {
            color: #2196F3;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        ${options.includeLogo ? '<img src="cid:companylogo@crm" alt="Company Logo" class="company-logo">' : ''}
        <h1>Quotation ${quotationData.number}</h1>
    </div>
    
    <div class="content">
        <p>Dear ${quotationData.customerName},</p>
        
        <p>Thank you for your inquiry. Please find attached the quotation <span class="highlight">#${quotationData.number}</span> 
        for your requested products/services.</p>
        
        <div class="quotation-details">
            <p><strong>Quotation Summary:</strong></p>
            <ul>
                <li>Quotation Number: ${quotationData.number}</li>
                <li>Date: ${new Date(quotationData.date).toLocaleDateString()}</li>
                <li>Valid Until: ${new Date(quotationData.expiryDate).toLocaleDateString()}</li>
                <li>Total Amount: $${quotationData.total.toFixed(2)}</li>
            </ul>
        </div>
        
        <p>The detailed quotation is attached as a PDF document. You can also view it online by clicking the button below:</p>
        
        <div style="text-align: center;">
            <a href="${options.viewLink || '#'}" class="button">View Quotation Online</a>
        </div>
        
        <p>To accept this quotation, please reply to this email or contact our sales team.</p>
        
        <p>If you have any questions or need further clarification, don't hesitate to contact us.</p>
        
        <p>Best regards,<br>
        <strong>${process.env.COMPANY_NAME || 'Your Company'}</strong><br>
        ${process.env.COMPANY_PHONE || ''}<br>
        ${process.env.COMPANY_EMAIL || ''}</p>
    </div>
    
    <div class="footer">
        <p>This is an automated email. Please do not reply to this message.</p>
        <p>${process.env.COMPANY_NAME || 'Your Company'} | ${process.env.COMPANY_ADDRESS || ''}</p>
    </div>
</body>
</html>`;
  }
  
  async sendBulkEmails(recipients, subject, content, attachments = []) {
    try {
      const results = [];
      
      for (const recipient of recipients) {
        try {
          const mailOptions = {
            from: `"${process.env.COMPANY_NAME}" <${process.env.SMTP_FROM}>`,
            to: recipient.email,
            subject: subject,
            html: content,
            attachments: attachments
          };
          
          const info = await this.transporter.sendMail(mailOptions);
          results.push({
            email: recipient.email,
            success: true,
            messageId: info.messageId
          });
        } catch (error) {
          results.push({
            email: recipient.email,
            success: false,
            error: error.message
          });
        }
      }
      
      return {
        total: recipients.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        details: results
      };
    } catch (error) {
      throw new Error(`Bulk email sending failed: ${error.message}`);
    }
  }
}

export default new EmailService();