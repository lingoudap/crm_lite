// client/src/components/templates/TemplateBuilder.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Grid,
  Paper,
  Typography,
  IconButton,
  Drawer,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Slider,
  Tabs,
  Tab,
  Divider,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as BackIcon,
  Preview as PreviewIcon,
  Code as CodeIcon,
  Settings as SettingsIcon,
  Palette as PaletteIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material';
import axios from 'axios';
import debounce from 'lodash/debounce';
import ComponentsPanel from './builder/ComponentsPanel';
import Canvas from './builder/Canvas';
import SettingsPanel from './builder/SettingsPanel';
import CodeEditor from './builder/CodeEditor';
import VariableManager from './builder/VariableManager';
import PreviewDialog from './PreviewDialog';
import './TemplateBuilder.css';

const TemplateBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState({
    name: '',
    description: '',
    type: 'quotation',
    category: 'standard',
    htmlContent: '',
    cssContent: '',
    javascriptContent: '',
    settings: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 50, right: 20, bottom: 50, left: 20 },
      header: { enabled: true, height: 100, repeatOnEachPage: true },
      footer: { enabled: true, height: 80, repeatOnEachPage: true }
    },
    variables: [],
    metadata: {
      fontFamily: 'Arial, sans-serif',
      fontSize: 12,
      primaryColor: '#000000',
      secondaryColor: '#666666',
      accentColor: '#2196F3'
    }
  });
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [activeTab, setActiveTab] = useState('design');
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [autoSave, setAutoSave] = useState(false);

  // Load template if editing
  useEffect(() => {
    if (id) {
      fetchTemplate();
    }
  }, [id]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/templates/${id}`);
      setTemplate(response.data);
      parseSections(response.data.htmlContent);
    } catch (err) {
      setError('Failed to load template: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const parseSections = (htmlContent) => {
    // Parse HTML to extract sections
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const sectionElements = doc.querySelectorAll('[data-section]');
    
    const parsedSections = Array.from(sectionElements).map((el, index) => ({
      id: `section-${index + 1}`,
      type: el.getAttribute('data-section') || 'generic',
      content: el.outerHTML,
      settings: {}
    }));
    
    setSections(parsedSections.length > 0 ? parsedSections : getDefaultSections());
  };

  const getDefaultSections = () => [
    {
      id: 'header',
      type: 'header',
      content: '<div class="header" data-section="header"><h1>Quotation</h1></div>',
      settings: {}
    },
    {
      id: 'customer-info',
      type: 'customer-info',
      content: '<div class="customer-info" data-section="customer-info"><h3>Customer Details</h3></div>',
      settings: {}
    },
    {
      id: 'items-table',
      type: 'items-table',
      content: '<div class="items-table" data-section="items-table"><h3>Items</h3><table><tr><th>Description</th><th>Qty</th><th>Price</th><th>Total</th></tr></table></div>',
      settings: {}
    },
    {
      id: 'totals',
      type: 'totals',
      content: '<div class="totals" data-section="totals"><h3>Total</h3></div>',
      settings: {}
    },
    {
      id: 'footer',
      type: 'footer',
      content: '<div class="footer" data-section="footer"><p>Thank you for your business!</p></div>',
      settings: {}
    }
  ];

  const addSection = (sectionType) => {
    const newSection = {
      id: `section-${Date.now()}`,
      type: sectionType,
      content: getDefaultSectionContent(sectionType),
      settings: getDefaultSectionSettings(sectionType)
    };
    setSections([...sections, newSection]);
    setSelectedSection(newSection);
  };

  const getDefaultSectionContent = (type) => {
    const defaults = {
      header: '<div class="header-section" data-section="header"><h1>Header</h1></div>',
      'customer-info': '<div class="customer-section" data-section="customer-info"><h3>Customer Information</h3></div>',
      'items-table': '<div class="items-section" data-section="items-table"><h3>Items</h3><table><tr><th>Description</th><th>Qty</th><th>Price</th><th>Total</th></tr></table></div>',
      totals: '<div class="totals-section" data-section="totals"><h3>Total Amount</h3></div>',
      terms: '<div class="terms-section" data-section="terms"><h3>Terms & Conditions</h3></div>',
      signature: '<div class="signature-section" data-section="signature"><h3>Signatures</h3></div>',
      footer: '<div class="footer-section" data-section="footer"><p>Footer Content</p></div>'
    };
    return defaults[type] || '<div data-section="generic">New Section</div>';
  };

  const getDefaultSectionSettings = (type) => {
    const defaults = {
      header: { showLogo: true, showTitle: true, alignment: 'left' },
      'customer-info': { showName: true, showAddress: true, showContact: true },
      'items-table': { showHeaders: true, showTotals: true, stripedRows: true },
      totals: { showSubtotal: true, showTax: true, showGrandTotal: true },
      terms: { editable: true, defaultTerms: 'Standard terms apply.' },
      signature: { showCustomer: true, showCompany: true },
      footer: { showPageNumbers: true, showDate: true }
    };
    return defaults[type] || {};
  };

  const updateSection = (sectionId, updates) => {
    setSections(sections.map(section => 
      section.id === sectionId ? { ...section, ...updates } : section
    ));
  };

  const deleteSection = (sectionId) => {
    setSections(sections.filter(section => section.id !== sectionId));
    if (selectedSection?.id === sectionId) {
      setSelectedSection(null);
    }
  };

  const moveSection = (dragIndex, hoverIndex) => {
    const draggedSection = sections[dragIndex];
    const newSections = [...sections];
    newSections.splice(dragIndex, 1);
    newSections.splice(hoverIndex, 0, draggedSection);
    setSections(newSections);
  };

  const generateHTMLFromSections = () => {
    return sections.map(section => section.content).join('\n');
  };

  const handleTemplateUpdate = (updates) => {
    setTemplate(prev => ({ ...prev, ...updates }));
  };

  const saveTemplate = debounce(async () => {
    try {
      setSaving(true);
      setError('');
      
      const htmlContent = generateHTMLFromSections();
      const templateData = {
        ...template,
        htmlContent
      };
      
      let response;
      if (id) {
        response = await axios.put(`/api/templates/${id}`, templateData);
      } else {
        response = await axios.post('/api/templates', templateData);
      }
      
      setSuccess('Template saved successfully!');
      if (!id) {
        navigate(`/templates/edit/${response.data.template._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  }, 500);

  const handlePreview = async () => {
    try {
      const htmlContent = generateHTMLFromSections();
      const previewResponse = await axios.post('/api/templates/preview', {
        templateId: id || 'preview',
        data: getSampleData()
      }, { responseType: 'blob' });
      
      const url = URL.createObjectURL(previewResponse.data);
      setPreviewData(url);
      setShowPreview(true);
    } catch (err) {
      setError('Failed to generate preview: ' + err.message);
    }
  };

  const getSampleData = () => ({
    quotation: {
      _id: 'sample-123',
      number: 'Q-2024-001',
      date: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
      subtotal: 1500,
      tax: 150,
      total: 1650,
      currency: 'USD',
      status: 'pending'
    },
    customer: {
      name: 'John Smith',
      company: 'ABC Corporation',
      email: 'john@example.com',
      phone: '+1 (555) 123-4567',
      address: '123 Main Street\nSuite 100\nNew York, NY 10001',
      taxId: 'TAX-123456'
    },
    items: [
      {
        description: 'Web Design Services',
        quantity: 10,
        unitPrice: 100,
        discount: 0,
        total: 1000
      },
      {
        description: 'Hosting (Annual)',
        quantity: 1,
        unitPrice: 500,
        discount: 10,
        total: 450
      }
    ],
    company: {
      name: 'Your Company Name',
      address: '456 Business Ave\nSan Francisco, CA 94107',
      phone: '+1 (555) 987-6543',
      email: 'info@company.com',
      website: 'www.company.com',
      logo: 'https://via.placeholder.com/150x50'
    }
  });

  const handleAutoSaveChange = (event) => {
    setAutoSave(event.target.checked);
  };

  useEffect(() => {
    if (autoSave && template.name) {
      const saveInterval = setInterval(() => {
        if (!saving) {
          saveTemplate();
        }
      }, 30000); // Auto-save every 30 seconds
      
      return () => clearInterval(saveInterval);
    }
  }, [autoSave, template.name, saving]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="template-builder">
        {/* Header */}
        <Paper className="builder-header" elevation={1}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <IconButton onClick={() => navigate('/templates')} sx={{ mr: 2 }}>
                <BackIcon />
              </IconButton>
              <TextField
                value={template.name}
                onChange={(e) => handleTemplateUpdate({ name: e.target.value })}
                placeholder="Template Name"
                variant="outlined"
                size="small"
                sx={{ width: 300, mr: 2 }}
              />
              <TextField
                value={template.description}
                onChange={(e) => handleTemplateUpdate({ description: e.target.value })}
                placeholder="Description"
                variant="outlined"
                size="small"
                sx={{ width: 300 }}
              />
            </Box>
            
            <Box display="flex" alignItems="center" gap={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoSave}
                    onChange={handleAutoSaveChange}
                    size="small"
                  />
                }
                label="Auto Save"
              />
              <Button
                variant="outlined"
                startIcon={<PreviewIcon />}
                onClick={handlePreview}
              >
                Preview
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={saveTemplate}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Tabs */}
        <Paper className="builder-tabs" elevation={1} sx={{ mt: 2 }}>
          <Tabs value={activeTab} onChange={(e, value) => setActiveTab(value)}>
            <Tab label="Design" value="design" icon={<PaletteIcon />} />
            <Tab label="Code" value="code" icon={<CodeIcon />} />
            <Tab label="Variables" value="variables" icon={<SettingsIcon />} />
          </Tabs>
        </Paper>

        {/* Main Content */}
        <Grid container spacing={2} className="builder-content" sx={{ mt: 2 }}>
          {activeTab === 'design' && (
            <>
              <Grid item xs={3}>
                <ComponentsPanel onAddSection={addSection} />
              </Grid>
              
              <Grid item xs={6}>
                <Canvas
                  sections={sections}
                  selectedSection={selectedSection}
                  onSelectSection={setSelectedSection}
                  onUpdateSection={updateSection}
                  onDeleteSection={deleteSection}
                  onMoveSection={moveSection}
                />
              </Grid>
              
              <Grid item xs={3}>
                <SettingsPanel
                  template={template}
                  selectedSection={selectedSection}
                  onTemplateUpdate={handleTemplateUpdate}
                  onSectionUpdate={updateSection}
                />
              </Grid>
            </>
          )}
          
          {activeTab === 'code' && (
            <Grid item xs={12}>
              <CodeEditor
                html={template.htmlContent}
                css={template.cssContent}
                js={template.javascriptContent}
                onHtmlChange={(html) => handleTemplateUpdate({ htmlContent: html })}
                onCssChange={(css) => handleTemplateUpdate({ cssContent: css })}
                onJsChange={(js) => handleTemplateUpdate({ javascriptContent: js })}
              />
            </Grid>
          )}
          
          {activeTab === 'variables' && (
            <Grid item xs={12}>
              <VariableManager
                variables={template.variables}
                onVariablesChange={(variables) => handleTemplateUpdate({ variables })}
              />
            </Grid>
          )}
        </Grid>

        {/* Preview Dialog */}
        <PreviewDialog
          open={showPreview}
          onClose={() => setShowPreview(false)}
          pdfUrl={previewData}
        />

        {/* Error/Success Messages */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        </Snackbar>
        
        <Snackbar
          open={!!success}
          autoHideDuration={3000}
          onClose={() => setSuccess('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity="success" onClose={() => setSuccess('')}>
            {success}
          </Alert>
        </Snackbar>
      </div>
    </DndProvider>
  );
};

export default TemplateBuilder;