// client/src/components/quotations/QuotationPrintDialog.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Switch,
  Box,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Print as PrintIcon,
  Email as EmailIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Preview as PreviewIcon
} from '@mui/icons-material';
import axios from 'axios';

const QuotationPrintDialog = ({ open, onClose, quotationId, quotationData }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [activeTab, setActiveTab] = useState('print');
  const [emailSettings, setEmailSettings] = useState({
    sendEmail: false,
    recipient: '',
    subject: '',
    message: ''
  });
  const [printSettings, setPrintSettings] = useState({
    copies: 1,
    colorMode: 'color',
    includeHeaderFooter: true
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      fetchTemplates();
      if (quotationData?.customer?.email) {
        setEmailSettings(prev => ({
          ...prev,
          recipient: quotationData.customer.email,
          subject: `Quotation #${quotationData.number} from ${process.env.REACT_APP_COMPANY_NAME}`,
          message: `Dear ${quotationData.customer.name},\n\nPlease find attached the quotation for your requested products/services.\n\nBest regards,\n${process.env.REACT_APP_COMPANY_NAME}`
        }));
      }
    }
  }, [open, quotationData]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/templates', {
        params: { type: 'quotation', limit: 50 }
      });
      setTemplates(response.data.templates);
      
      // Try to find default template
      const defaultTemplate = response.data.templates.find(t => t.isDefault);
      if (defaultTemplate) {
        setSelectedTemplate(defaultTemplate._id);
      } else if (response.data.templates.length > 0) {
        setSelectedTemplate(response.data.templates[0]._id);
      }
    } catch (err) {
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = async () => {
    if (!selectedTemplate) return;
    
    try {
      setGenerating(true);
      const response = await axios.post('/api/templates/preview', {
        templateId: selectedTemplate,
        data: quotationData
      }, { responseType: 'blob' });
      
      const url = URL.createObjectURL(response.data);
      setPreviewUrl(url);
      setActiveTab('preview');
    } catch (err) {
      setError('Failed to generate preview');
    } finally {
      setGenerating(false);
    }
  };

  const generatePDF = async (action = 'download') => {
    if (!selectedTemplate) return;
    
    try {
      setGenerating(true);
      setError('');
      
      const response = await axios.post('/api/templates/generate', {
        templateId: selectedTemplate,
        data: quotationData,
        options: {
          printSettings,
          sendEmail: action === 'email' && emailSettings.sendEmail,
          recipientEmail: emailSettings.recipient,
          emailOptions: {
            subject: emailSettings.subject,
            body: emailSettings.message
          }
        }
      });
      
      if (action === 'download') {
        // Download the PDF
        const downloadResponse = await axios.get(response.data.pdf.url, {
          responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([downloadResponse.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', response.data.pdf.filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        alert('PDF downloaded successfully!');
        onClose();
      } else if (action === 'email') {
        alert('Email sent successfully!');
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate PDF');
    } finally {
      setGenerating(false);
    }
  };

  const handleEmailSettingsChange = (field, value) => {
    setEmailSettings(prev => ({ ...prev, [field]: value }));
  };

  const handlePrintSettingsChange = (field, value) => {
    setPrintSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Print Quotation #{quotationData?.number}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        <Tabs value={activeTab} onChange={(e, value) => setActiveTab(value)} sx={{ mb: 2 }}>
          <Tab label="Print Settings" value="print" />
          <Tab label="Preview" value="preview" disabled={!previewUrl} />
          <Tab label="Email" value="email" />
        </Tabs>
        
        {activeTab === 'print' && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Select Template
                </Typography>
                
                {loading ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {templates.map(template => (
                      <Grid item xs={12} sm={6} key={template._id}>
                        <Paper
                          elevation={selectedTemplate === template._id ? 3 : 1}
                          onClick={() => setSelectedTemplate(template._id)}
                          sx={{
                            p: 2,
                            cursor: 'pointer',
                            border: selectedTemplate === template._id ? '2px solid #2196F3' : '1px solid #e0e0e0',
                            borderRadius: 1,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              borderColor: '#2196F3',
                              bgcolor: 'action.hover'
                            }
                          }}
                        >
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle1">
                              {template.name}
                            </Typography>
                            {template.isDefault && (
                              <Typography variant="caption" color="primary">
                                Default
                              </Typography>
                            )}
                          </Box>
                          <Typography variant="body2" color="textSecondary">
                            {template.description}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Used {template.usageCount || 0} times
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Print Options
                </Typography>
                
                <TextField
                  label="Number of Copies"
                  type="number"
                  size="small"
                  value={printSettings.copies}
                  onChange={(e) => handlePrintSettingsChange('copies', parseInt(e.target.value) || 1)}
                  fullWidth
                  sx={{ mb: 2 }}
                  inputProps={{ min: 1, max: 10 }}
                />
                
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Color Mode</InputLabel>
                  <Select
                    value={printSettings.colorMode}
                    onChange={(e) => handlePrintSettingsChange('colorMode', e.target.value)}
                    label="Color Mode"
                  >
                    <MenuItem value="color">Color</MenuItem>
                    <MenuItem value="grayscale">Grayscale</MenuItem>
                    <MenuItem value="blackwhite">Black & White</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={printSettings.includeHeaderFooter}
                      onChange={(e) => handlePrintSettingsChange('includeHeaderFooter', e.target.checked)}
                    />
                  }
                  label="Include Header & Footer"
                />
              </Paper>
            </Grid>
          </Grid>
        )}
        
        {activeTab === 'preview' && previewUrl && (
          <Box sx={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', bgcolor: '#f0f0f0' }}>
              <iframe
                src={previewUrl}
                title="PDF Preview"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </Box>
          </Box>
        )}
        
        {activeTab === 'email' && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Email Settings
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={emailSettings.sendEmail}
                  onChange={(e) => handleEmailSettingsChange('sendEmail', e.target.checked)}
                />
              }
              label="Send via Email"
              sx={{ mb: 2 }}
            />
            
            {emailSettings.sendEmail && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Recipient Email"
                    value={emailSettings.recipient}
                    onChange={(e) => handleEmailSettingsChange('recipient', e.target.value)}
                    fullWidth
                    size="small"
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Subject"
                    value={emailSettings.subject}
                    onChange={(e) => handleEmailSettingsChange('subject', e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Message"
                    value={emailSettings.message}
                    onChange={(e) => handleEmailSettingsChange('message', e.target.value)}
                    fullWidth
                    multiline
                    rows={4}
                    size="small"
                  />
                </Grid>
              </Grid>
            )}
          </Paper>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={generating}>
          Cancel
        </Button>
        
        <Tooltip title="Generate Preview">
          <Button
            onClick={generatePreview}
            disabled={!selectedTemplate || generating}
            startIcon={<PreviewIcon />}
          >
            Preview
          </Button>
        </Tooltip>
        
        <Button
          onClick={() => generatePDF('download')}
          disabled={!selectedTemplate || generating}
          variant="contained"
          startIcon={<DownloadIcon />}
        >
          {generating ? 'Generating...' : 'Download PDF'}
        </Button>
        
        {emailSettings.sendEmail && (
          <Button
            onClick={() => generatePDF('email')}
            disabled={!selectedTemplate || generating || !emailSettings.recipient}
            variant="contained"
            color="secondary"
            startIcon={<EmailIcon />}
          >
            {generating ? 'Sending...' : 'Send Email'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default QuotationPrintDialog;