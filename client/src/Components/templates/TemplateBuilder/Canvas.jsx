// client/src/components/templates/builder/Canvas.jsx
import React from 'react';
import {
  Paper,
  Box,
  Typography,
  IconButton,
  Button,
  Alert
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material';
import { useDrop, useDrag } from 'react-dnd';
import SectionEditor from './SectionEditor';

const Canvas = ({
  sections,
  selectedSection,
  onSelectSection,
  onUpdateSection,
  onDeleteSection,
  onMoveSection
}) => {
  const [{ canDrop, isOver }, drop] = useDrop(() => ({
    accept: ['component', 'element', 'section'],
    drop: (item, monitor) => {
      if (item.source === 'components-panel') {
        // Handle new component drop
        console.log('Dropped new component:', item);
      }
      return { name: 'Canvas' };
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  }));

  const isActive = canDrop && isOver;

  const handleSectionClick = (section) => {
    onSelectSection(section);
  };

  const handleSectionUpdate = (sectionId, content) => {
    onUpdateSection(sectionId, { content });
  };

  const handleSectionDelete = (sectionId) => {
    onDeleteSection(sectionId);
  };

  if (sections.length === 0) {
    return (
      <Paper 
        ref={drop}
        className="canvas empty" 
        elevation={1}
        sx={{ 
          p: 4, 
          textAlign: 'center',
          height: 'calc(100vh - 200px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          border: isActive ? '2px dashed #2196F3' : '1px dashed #ddd',
          bgcolor: isActive ? 'action.hover' : 'background.paper'
        }}
      >
        <Typography variant="h6" color="textSecondary" gutterBottom>
          Drop components here
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Drag and drop components from the left panel or click "Add Section"
        </Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          sx={{ mt: 2 }}
          onClick={() => {
            // Add default section
            const newSection = {
              id: `section-${Date.now()}`,
              type: 'generic',
              content: '<div>New Section</div>',
              settings: {}
            };
            onUpdateSection(newSection.id, newSection);
          }}
        >
          Add First Section
        </Button>
      </Paper>
    );
  }

  return (
    <Paper 
      ref={drop}
      className="canvas" 
      elevation={1}
      sx={{ 
        p: 2,
        height: 'calc(100vh - 200px)',
        overflow: 'auto',
        border: isActive ? '2px dashed #2196F3' : '1px solid #e0e0e0',
        bgcolor: isActive ? 'action.hover' : 'background.paper'
      }}
    >
      {isActive && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Drop component here
        </Alert>
      )}
      
      {sections.map((section, index) => (
        <Box key={section.id} sx={{ mb: 2 }}>
          <SectionEditor
            section={section}
            index={index}
            isSelected={selectedSection?.id === section.id}
            onClick={() => handleSectionClick(section)}
            onUpdate={handleSectionUpdate}
            onDelete={handleSectionDelete}
            onMove={onMoveSection}
          />
        </Box>
      ))}
      
      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => {
            const newSection = {
              id: `section-${Date.now()}`,
              type: 'generic',
              content: '<div>New Section</div>',
              settings: {}
            };
            onUpdateSection(newSection.id, newSection);
            onSelectSection(newSection);
          }}
        >
          Add Section
        </Button>
      </Box>
    </Paper>
  );
};

export default Canvas;