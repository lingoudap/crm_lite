// client/src/components/quotations/QuotationDetail.jsx
import React, { useState } from 'react';
import {
  Button,
  Box,
  Paper,
  Typography,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Alert
} from '@mui/material';
import {
  Print as PrintIcon,
  Edit as EditIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon,
  Email as EmailIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import QuotationPrintDialog from './QuotationPrintDialog';

const QuotationDetail = ({ quotation }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [printMethod, setPrintMethod] = useState('');

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handlePrintClick = (method) => {
    setPrintMethod(method);
    setShowPrintDialog(true);
    handleMenuClose();
  };

  const handleEmailClick = () => {
    setPrintMethod('email');
    setShowPrintDialog(true);
  };

  if (!quotation) {
    return (
      <Alert severity="info">
        Quotation not found
      </Alert>
    );
  }

  return (
    <div>
      {/* Header with actions */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <div>
            <Typography variant="h4" gutterBottom>
              Quotation #{quotation.number}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Created on {new Date(quotation.createdAt).toLocaleDateString()}
            </Typography>
          </div>
          
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/quotations/edit/${quotation._id}`)}
            >
              Edit
            </Button>
            
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={() => setShowPrintDialog(true)}
            >
              Print
            </Button>
            
            <IconButton onClick={handleMenuOpen}>
              <MoreVertIcon />
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => handlePrintClick('download')}>
                <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
                Download PDF
              </MenuItem>
              <MenuItem onClick={() => handlePrintClick('email')}>
                <EmailIcon fontSize="small" sx={{ mr: 1 }} />
                Email to Customer
              </MenuItem>
              <MenuItem onClick={() => handlePrintClick('share')}>
                <ShareIcon fontSize="small" sx={{ mr: 1 }} />
                Share Link
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Paper>
      
      {/* Quotation details content */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {/* Your existing quotation details */}
        </Grid>
        
        <Grid item xs={12} md={4}>
          {/* Print history section */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Print History
            </Typography>
            {/* Show recent prints */}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Print Dialog */}
      <QuotationPrintDialog
        open={showPrintDialog}
        onClose={() => setShowPrintDialog(false)}
        quotationId={quotation._id}
        quotationData={{
          ...quotation,
          company: {
            name: process.env.REACT_APP_COMPANY_NAME,
            address: process.env.REACT_APP_COMPANY_ADDRESS,
            phone: process.env.REACT_APP_COMPANY_PHONE,
            email: process.env.REACT_APP_COMPANY_EMAIL,
            website: process.env.REACT_APP_COMPANY_WEBSITE
          }
        }}
      />
    </div>
  );
};

export default QuotationDetail;