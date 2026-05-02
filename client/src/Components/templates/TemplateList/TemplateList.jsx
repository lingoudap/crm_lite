// client/src/components/templates/TemplateList.jsx
import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Typography, 
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  FormControl,
  InputLabel,
  Box,
  CircularProgress,
  Alert,
  Pagination,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as DuplicateIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  MoreVert as MoreVertIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TemplateFilters from './TemplateFilters';
import './TemplateList.css';

const TemplateList = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTemplates, setTotalTemplates] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const TEMPLATE_TYPES = [
    { value: 'quotation', label: 'Quotation', color: 'primary' },
    { value: 'invoice', label: 'Invoice', color: 'success' },
    { value: 'proforma-invoice', label: 'Proforma Invoice', color: 'info' },
    { value: 'purchase-order', label: 'Purchase Order', color: 'warning' },
    { value: 'delivery-challan', label: 'Delivery Challan', color: 'secondary' },
    { value: 'receipt', label: 'Receipt', color: 'error' }
  ];

  const CATEGORIES = [
    { value: 'standard', label: 'Standard', color: 'default' },
    { value: 'professional', label: 'Professional', color: 'primary' },
    { value: 'minimal', label: 'Minimal', color: 'secondary' },
    { value: 'modern', label: 'Modern', color: 'info' },
    { value: 'custom', label: 'Custom', color: 'warning' }
  ];

  useEffect(() => {
    fetchTemplates();
  }, [page, searchTerm, selectedType, selectedCategory, showOnlyFavorites, sortBy, sortOrder]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        page,
        limit: 12,
        sortBy,
        sortOrder
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedType !== 'all') params.append('type', selectedType);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (showOnlyFavorites) params.append('onlyFavorites', 'true');
      
      const response = await axios.get(`/api/templates?${params.toString()}`);
      
      setTemplates(response.data.templates);
      setFilteredTemplates(response.data.templates);
      setTotalPages(response.data.totalPages);
      setTotalTemplates(response.data.total);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch templates');
      console.error('Fetch templates error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handleTypeChange = (event) => {
    setSelectedType(event.target.value);
    setPage(1);
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
    setPage(1);
  };

  const handleFavoriteToggle = async (templateId, isFavorite) => {
    try {
      const response = await axios.post(`/api/templates/${templateId}/toggle-favorite`);
      
      setTemplates(templates.map(template => 
        template._id === templateId 
          ? { ...template, isFavorite: response.data.isFavorite }
          : template
      ));
    } catch (err) {
      console.error('Toggle favorite error:', err);
      alert('Failed to update favorite');
    }
  };

  const handleMenuOpen = (event, template) => {
    setAnchorEl(event.currentTarget);
    setSelectedTemplate(template);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTemplate(null);
  };

  const handleEdit = () => {
    if (selectedTemplate) {
      navigate(`/templates/edit/${selectedTemplate._id}`);
    }
    handleMenuClose();
  };

  const handleDuplicate = async () => {
    if (selectedTemplate) {
      try {
        const newName = prompt('Enter new template name:', `${selectedTemplate.name} (Copy)`);
        if (newName) {
          const response = await axios.post(`/api/templates/${selectedTemplate._id}/duplicate`, {
            name: newName
          });
          
          if (response.data.template) {
            alert('Template duplicated successfully');
            fetchTemplates();
          }
        }
      } catch (err) {
        console.error('Duplicate error:', err);
        alert('Failed to duplicate template');
      }
    }
    handleMenuClose();
  };

  const handleSetDefault = async () => {
    if (selectedTemplate) {
      try {
        const response = await axios.post(`/api/templates/${selectedTemplate._id}/set-default`);
        
        if (response.data.template) {
          alert('Template set as default successfully');
          fetchTemplates();
        }
      } catch (err) {
        console.error('Set default error:', err);
        alert('Failed to set default template');
      }
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    if (selectedTemplate) {
      setTemplateToDelete(selectedTemplate);
      setShowDeleteDialog(true);
    }
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (templateToDelete) {
      try {
        await axios.delete(`/api/templates/${templateToDelete._id}`);
        alert('Template deleted successfully');
        fetchTemplates();
      } catch (err) {
        console.error('Delete error:', err);
        alert('Failed to delete template');
      } finally {
        setShowDeleteDialog(false);
        setTemplateToDelete(null);
      }
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const getTypeColor = (type) => {
    const typeConfig = TEMPLATE_TYPES.find(t => t.value === type);
    return typeConfig?.color || 'default';
  };

  const getCategoryColor = (category) => {
    const categoryConfig = CATEGORIES.find(c => c.value === category);
    return categoryConfig?.color || 'default';
  };

  if (loading && templates.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="template-list-container">
      <div className="template-list-header">
        <Typography variant="h4" component="h1" gutterBottom>
          Print Templates
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/templates/create')}
        >
          Create Template
        </Button>
      </div>

      <div className="template-list-filters">
        <div className="filter-section">
          <TextField
            placeholder="Search templates..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: <SearchIcon color="action" />
            }}
            sx={{ width: 300 }}
          />
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={selectedType}
              onChange={handleTypeChange}
              label="Type"
            >
              <MenuItem value="all">All Types</MenuItem>
              {TEMPLATE_TYPES.map(type => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={selectedCategory}
              onChange={handleCategoryChange}
              label="Category"
            >
              <MenuItem value="all">All Categories</MenuItem>
              {CATEGORIES.map(category => (
                <MenuItem key={category.value} value={category.value}>
                  {category.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControlLabel
            control={
              <Switch
                checked={showOnlyFavorites}
                onChange={(e) => setShowOnlyFavorites(e.target.checked)}
                color="primary"
              />
            }
            label="Favorites Only"
          />
          
          <Tooltip title="Refresh">
            <IconButton onClick={fetchTemplates}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </div>
      </div>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {filteredTemplates.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No templates found
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {searchTerm || selectedType !== 'all' || selectedCategory !== 'all'
              ? 'Try changing your search criteria'
              : 'Create your first template to get started'}
          </Typography>
          {!searchTerm && selectedType === 'all' && selectedCategory === 'all' && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate('/templates/create')}
              sx={{ mt: 2 }}
            >
              Create Template
            </Button>
          )}
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {filteredTemplates.map((template) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={template._id}>
                <Card className="template-card" elevation={2}>
                  <CardContent>
                    <div className="template-card-header">
                      <div className="template-type">
                        <Chip
                          label={template.type}
                          color={getTypeColor(template.type)}
                          size="small"
                        />
                        {template.isDefault && (
                          <Chip
                            label="Default"
                            color="primary"
                            size="small"
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </div>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, template)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </div>
                    
                    <Typography variant="h6" gutterBottom noWrap>
                      {template.name}
                    </Typography>
                    
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {template.description || 'No description'}
                    </Typography>
                    
                    <div className="template-tags">
                      {template.category && (
                        <Chip
                          label={template.category}
                          size="small"
                          variant="outlined"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      )}
                      {template.tags?.slice(0, 2).map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))}
                      {template.tags?.length > 2 && (
                        <Chip
                          label={`+${template.tags.length - 2}`}
                          size="small"
                          variant="outlined"
                          sx={{ mb: 1 }}
                        />
                      )}
                    </div>
                    
                    <div className="template-stats">
                      <Typography variant="caption" color="textSecondary">
                        <PrintIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                        {template.stats?.totalPrints || 0} prints
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ ml: 2 }}>
                        <ViewIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                        {template.usageCount || 0} uses
                      </Typography>
                    </div>
                    
                    <Typography variant="caption" display="block" color="textSecondary" sx={{ mt: 1 }}>
                      Last updated: {new Date(template.updatedAt).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                  
                  <CardActions className="template-card-actions">
                    <Tooltip title={template.isFavorite ? "Remove from favorites" : "Add to favorites"}>
                      <IconButton
                        size="small"
                        onClick={() => handleFavoriteToggle(template._id, template.isFavorite)}
                        color={template.isFavorite ? "warning" : "default"}
                      >
                        {template.isFavorite ? <StarIcon /> : <StarBorderIcon />}
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/templates/edit/${template._id}`)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Use Template">
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        startIcon={<PrintIcon />}
                        onClick={() => navigate(`/templates/use/${template._id}`)}
                      >
                        Use
                      </Button>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDuplicate}>
          <DuplicateIcon fontSize="small" sx={{ mr: 1 }} />
          Duplicate
        </MenuItem>
        {!selectedTemplate?.isDefault && (
          <MenuItem onClick={handleSetDefault}>
            <StarIcon fontSize="small" sx={{ mr: 1 }} />
            Set as Default
          </MenuItem>
        )}
        <MenuItem onClick={handleDeleteClick}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      >
        <DialogTitle>Delete Template</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{templateToDelete?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default TemplateList;    