// client/src/components/templates/builder/SettingsPanel.jsx
import React, { useState } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Button,
  IconButton,
  Box,
  Divider,
  Chip,
  Alert
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Palette as PaletteIcon,
  FormatSize as FontSizeIcon,
  Title as TitleIcon,
  Image as ImageIcon,
  BorderAll as BorderIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { ChromePicker } from 'react-color';

const SettingsPanel = ({ template, selectedSection, onTemplateUpdate, onSectionUpdate }) => {
  const [activeTab, setActiveTab] = useState('template');
  const [colorPicker, setColorPicker] = useState(null);

  const handleTemplateSettingsChange = (field, value) => {
    const newSettings = { ...template.settings };
    const keys = field.split('.');
    
    if (keys.length === 1) {
      newSettings[keys[0]] = value;
    } else if (keys.length === 2) {
      if (!newSettings[keys[0]]) newSettings[keys[0]] = {};
      newSettings[keys[0]][keys[1]] = value;
    } else if (keys.length === 3) {
      if (!newSettings[keys[0]]) newSettings[keys[0]] = {};
      if (!newSettings[keys[0]][keys[1]]) newSettings[keys[0]][keys[1]] = {};
      newSettings[keys[0]][keys[1]][keys[2]] = value;
    }
    
    onTemplateUpdate({ settings: newSettings });
  };

  const handleMetadataChange = (field, value) => {
    const newMetadata = { ...template.metadata };
    newMetadata[field] = value;
    onTemplateUpdate({ metadata: newMetadata });
  };

  const handleSectionSettingsChange = (field, value) => {
    if (selectedSection) {
      const newSettings = { ...selectedSection.settings };
      newSettings[field] = value;
      onSectionUpdate(selectedSection.id, { settings: newSettings });
    }
  };

  const renderTemplateSettings = () => (
    <Box>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography><SettingsIcon sx={{ mr: 1 }} /> Page Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Page Size</InputLabel>
                <Select
                  value={template.settings.pageSize || 'A4'}
                  onChange={(e) => handleTemplateSettingsChange('pageSize', e.target.value)}
                  label="Page Size"
                >
                  <MenuItem value="A4">A4 (210 × 297 mm)</MenuItem>
                  <MenuItem value="A3">A3 (297 × 420 mm)</MenuItem>
                  <MenuItem value="Letter">Letter (216 × 279 mm)</MenuItem>
                  <MenuItem value="Legal">Legal (216 × 356 mm)</MenuItem>
                  <MenuItem value="A5">A5 (148 × 210 mm)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Orientation</InputLabel>
                <Select
                  value={template.settings.orientation || 'portrait'}
                  onChange={(e) => handleTemplateSettingsChange('orientation', e.target.value)}
                  label="Orientation"
                >
                  <MenuItem value="portrait">Portrait</MenuItem>
                  <MenuItem value="landscape">Landscape</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography gutterBottom>Margins</Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <TextField
                    label="Top"
                    type="number"
                    size="small"
                    value={template.settings.margins?.top || 50}
                    onChange={(e) => handleTemplateSettingsChange('margins.top', parseInt(e.target.value))}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Bottom"
                    type="number"
                    size="small"
                    value={template.settings.margins?.bottom || 50}
                    onChange={(e) => handleTemplateSettingsChange('margins.bottom', parseInt(e.target.value))}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Left"
                    type="number"
                    size="small"
                    value={template.settings.margins?.left || 20}
                    onChange={(e) => handleTemplateSettingsChange('margins.left', parseInt(e.target.value))}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Right"
                    type="number"
                    size="small"
                    value={template.settings.margins?.right || 20}
                    onChange={(e) => handleTemplateSettingsChange('margins.right', parseInt(e.target.value))}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
      
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography><PaletteIcon sx={{ mr: 1 }} /> Design Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Font Family"
                value={template.metadata?.fontFamily || 'Arial, sans-serif'}
                onChange={(e) => handleMetadataChange('fontFamily', e.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography gutterBottom>Font Size: {template.metadata?.fontSize || 12}px</Typography>
              <Slider
                value={template.metadata?.fontSize || 12}
                onChange={(e, value) => handleMetadataChange('fontSize', value)}
                min={8}
                max={24}
                step={1}
                valueLabelDisplay="auto"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography gutterBottom>Primary Color</Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    bgcolor: template.metadata?.primaryColor || '#000000',
                    border: '1px solid #ddd',
                    cursor: 'pointer'
                  }}
                  onClick={() => setColorPicker('primaryColor')}
                />
                <TextField
                  value={template.metadata?.primaryColor || '#000000'}
                  onChange={(e) => handleMetadataChange('primaryColor', e.target.value)}
                  size="small"
                  fullWidth
                />
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Typography gutterBottom>Accent Color</Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    bgcolor: template.metadata?.accentColor || '#2196F3',
                    border: '1px solid #ddd',
                    cursor: 'pointer'
                  }}
                  onClick={() => setColorPicker('accentColor')}
                />
                <TextField
                  value={template.metadata?.accentColor || '#2196F3'}
                  onChange={(e) => handleMetadataChange('accentColor', e.target.value)}
                  size="small"
                  fullWidth
                />
              </Box>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
      
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography><TitleIcon sx={{ mr: 1 }} /> Header & Footer</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={template.settings.header?.enabled || true}
                    onChange={(e) => handleTemplateSettingsChange('header.enabled', e.target.checked)}
                  />
                }
                label="Enable Header"
              />
            </Grid>
            
            {template.settings.header?.enabled && (
              <Grid item xs={12}>
                <TextField
                  label="Header Height"
                  type="number"
                  size="small"
                  value={template.settings.header?.height || 100}
                  onChange={(e) => handleTemplateSettingsChange('header.height', parseInt(e.target.value))}
                  fullWidth
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={template.settings.header?.repeatOnEachPage || true}
                      onChange={(e) => handleTemplateSettingsChange('header.repeatOnEachPage', e.target.checked)}
                    />
                  }
                  label="Repeat on each page"
                />
              </Grid>
            )}
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={template.settings.footer?.enabled || true}
                    onChange={(e) => handleTemplateSettingsChange('footer.enabled', e.target.checked)}
                  />
                }
                label="Enable Footer"
              />
            </Grid>
            
            {template.settings.footer?.enabled && (
              <Grid item xs={12}>
                <TextField
                  label="Footer Height"
                  type="number"
                  size="small"
                  value={template.settings.footer?.height || 80}
                  onChange={(e) => handleTemplateSettingsChange('footer.height', parseInt(e.target.value))}
                  fullWidth
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={template.settings.footer?.repeatOnEachPage || true}
                      onChange={(e) => handleTemplateSettingsChange('footer.repeatOnEachPage', e.target.checked)}
                    />
                  }
                  label="Repeat on each page"
                />
              </Grid>
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>
      
      {colorPicker && (
        <Box sx={{ position: 'absolute', zIndex: 1000, mt: 2 }}>
          <ChromePicker
            color={template.metadata?.[colorPicker] || '#000000'}
            onChangeComplete={(color) => {
              handleMetadataChange(colorPicker, color.hex);
              setColorPicker(null);
            }}
          />
          <Button onClick={() => setColorPicker(null)}>Close</Button>
        </Box>
      )}
    </Box>
  );

  const renderSectionSettings = () => {
    if (!selectedSection) {
      return (
        <Box textAlign="center" py={4}>
          <Typography color="textSecondary">
            Select a section to edit its settings
          </Typography>
        </Box>
      );
    }

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {selectedSection.type} Settings
        </Typography>
        
        <TextField
          label="Section ID"
          value={selectedSection.id}
          fullWidth
          size="small"
          sx={{ mb: 2 }}
          disabled
        />
        
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Section Type</InputLabel>
          <Select
            value={selectedSection.type}
            onChange={(e) => onSectionUpdate(selectedSection.id, { type: e.target.value })}
            label="Section Type"
          >
            <MenuItem value="header">Header</MenuItem>
            <MenuItem value="customer-info">Customer Info</MenuItem>
            <MenuItem value="items-table">Items Table</MenuItem>
            <MenuItem value="totals">Totals</MenuItem>
            <MenuItem value="terms">Terms & Conditions</MenuItem>
            <MenuItem value="signature">Signature</MenuItem>
            <MenuItem value="footer">Footer</MenuItem>
            <MenuItem value="generic">Generic</MenuItem>
          </Select>
        </FormControl>
        
        {selectedSection.type === 'header' && (
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={selectedSection.settings?.showLogo || false}
                  onChange={(e) => handleSectionSettingsChange('showLogo', e.target.checked)}
                />
              }
              label="Show Logo"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={selectedSection.settings?.showTitle || true}
                  onChange={(e) => handleSectionSettingsChange('showTitle', e.target.checked)}
                />
              }
              label="Show Title"
            />
          </Box>
        )}
        
        {selectedSection.type === 'items-table' && (
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={selectedSection.settings?.showHeaders || true}
                  onChange={(e) => handleSectionSettingsChange('showHeaders', e.target.checked)}
                />
              }
              label="Show Table Headers"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={selectedSection.settings?.stripedRows || true}
                  onChange={(e) => handleSectionSettingsChange('stripedRows', e.target.checked)}
                />
              }
              label="Striped Rows"
            />
          </Box>
        )}
        
        <Button
          variant="outlined"
          color="error"
          fullWidth
          startIcon={<DeleteIcon />}
          onClick={() => {
            if (window.confirm('Are you sure you want to delete this section?')) {
              onSectionUpdate(selectedSection.id, { deleted: true });
            }
          }}
          sx={{ mt: 2 }}
        >
          Delete Section
        </Button>
      </Box>
    );
  };

  return (
    <Paper className="settings-panel" elevation={1} sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Button
          variant={activeTab === 'template' ? 'contained' : 'text'}
          onClick={() => setActiveTab('template')}
          sx={{ mr: 1 }}
          size="small"
        >
          Template
        </Button>
        <Button
          variant={activeTab === 'section' ? 'contained' : 'text'}
          onClick={() => setActiveTab('section')}
          size="small"
          disabled={!selectedSection}
        >
          Section
        </Button>
      </Box>
      
      {activeTab === 'template' ? renderTemplateSettings() : renderSectionSettings()}
    </Paper>
  );
};

export default SettingsPanel;