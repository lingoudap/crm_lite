// client/src/components/templates/builder/ComponentsPanel.jsx
import React from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Box
} from '@mui/material';
import {
  Title as TitleIcon,
  Person as PersonIcon,
  TableChart as TableIcon,
  Calculate as CalculateIcon,
  Description as DescriptionIcon,
  Create as CreateIcon,
  Notes as NotesIcon,
  Image as ImageIcon,
  TextFields as TextIcon,
  DateRange as DateIcon,
  AttachMoney as MoneyIcon,
  Numbers as NumberIcon,
  CheckBox as CheckboxIcon
} from '@mui/icons-material';
import { useDrag } from 'react-dnd';

const COMPONENT_TYPES = {
  sections: [
    { id: 'header', label: 'Header', icon: <TitleIcon />, category: 'layout' },
    { id: 'customer-info', label: 'Customer Info', icon: <PersonIcon />, category: 'content' },
    { id: 'items-table', label: 'Items Table', icon: <TableIcon />, category: 'content' },
    { id: 'totals', label: 'Totals Section', icon: <CalculateIcon />, category: 'content' },
    { id: 'terms', label: 'Terms & Conditions', icon: <DescriptionIcon />, category: 'footer' },
    { id: 'signature', label: 'Signature Area', icon: <CreateIcon />, category: 'footer' },
    { id: 'footer', label: 'Footer', icon: <NotesIcon />, category: 'footer' }
  ],
  elements: [
    { id: 'text', label: 'Text Element', icon: <TextIcon />, category: 'basic' },
    { id: 'image', label: 'Image', icon: <ImageIcon />, category: 'media' },
    { id: 'date', label: 'Date Field', icon: <DateIcon />, category: 'field' },
    { id: 'currency', label: 'Currency Field', icon: <MoneyIcon />, category: 'field' },
    { id: 'number', label: 'Number Field', icon: <NumberIcon />, category: 'field' },
    { id: 'checkbox', label: 'Checkbox', icon: <CheckboxIcon />, category: 'field' }
  ],
  variables: [
    { id: 'customer.name', label: 'Customer Name', type: 'text' },
    { id: 'customer.email', label: 'Customer Email', type: 'text' },
    { id: 'quotation.number', label: 'Quotation Number', type: 'text' },
    { id: 'quotation.date', label: 'Quotation Date', type: 'date' },
    { id: 'quotation.total', label: 'Total Amount', type: 'currency' },
    { id: 'company.name', label: 'Company Name', type: 'text' }
  ]
};

const DraggableComponent = ({ component, type }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: type || 'component',
    item: { ...component, source: 'components-panel' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }));

  return (
    <ListItem
      ref={drag}
      button
      sx={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        mb: 1,
        borderRadius: 1,
        '&:hover': { bgcolor: 'action.hover' }
      }}
    >
      <ListItemIcon>
        {component.icon}
      </ListItemIcon>
      <ListItemText primary={component.label} />
      {component.category && (
        <Chip label={component.category} size="small" variant="outlined" />
      )}
    </ListItem>
  );
};

const ComponentsPanel = ({ onAddSection }) => {
  const handleComponentClick = (component) => {
    onAddSection(component.id);
  };

  return (
    <Paper className="components-panel" elevation={1} sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Components
      </Typography>
      
      <Box mb={3}>
        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
          Sections
        </Typography>
        <List dense>
          {COMPONENT_TYPES.sections.map((component) => (
            <div key={component.id} onClick={() => handleComponentClick(component)}>
              <DraggableComponent component={component} />
            </div>
          ))}
        </List>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Box mb={3}>
        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
          Elements
        </Typography>
        <List dense>
          {COMPONENT_TYPES.elements.map((component) => (
            <DraggableComponent key={component.id} component={component} type="element" />
          ))}
        </List>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Box>
        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
          Variables
        </Typography>
        <List dense>
          {COMPONENT_TYPES.variables.map((variable) => (
            <ListItem
              key={variable.id}
              button
              sx={{
                mb: 0.5,
                borderRadius: 1,
                '&:hover': { bgcolor: 'action.hover' }
              }}
              onClick={() => {
                // Insert variable at cursor position
                const variableText = `{{${variable.id}}}`;
                // This would typically interact with a contenteditable or textarea
                console.log('Insert variable:', variableText);
              }}
            >
              <ListItemText 
                primary={variable.label} 
                secondary={`{{${variable.id}}}`}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Paper>
  );
};

export default ComponentsPanel;