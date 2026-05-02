import React, { useState } from 'react';
import './BulkUpload.css';

const BulkUpload = () => {
  const [selectedModule, setSelectedModule] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const modules = [
    { value: 'lead', label: 'Lead', fields: ['Name', 'Email', 'Phone', 'Company', 'Status', 'Source'] },
    { value: 'quotation', label: 'Quotation', fields: ['QuotNo', 'EnqRef', 'CName', 'Amount', 'Descr', 'Date'] },
    { value: 'customer', label: 'Customer', fields: ['Name', 'Email', 'Phone', 'Company', 'Address', 'City'] },
    { value: 'order', label: 'Order', fields: ['OrderNo', 'CName', 'Amount', 'Date', 'Status', 'Notes'] },
    { value: 'followup', label: 'Follow-Up', fields: ['LeadID', 'FollowUpDate', 'Notes', 'Status', 'Priority'] },
  ];

  // Get the selected module config
  const selectedModuleConfig = modules.find(m => m.value === selectedModule);

  // Handle module selection
  const handleModuleChange = (e) => {
    setSelectedModule(e.target.value);
    setUploadedFile(null);
    setUploadResult(null);
  };

  // Download template as CSV
  const handleDownloadTemplate = () => {
    if (!selectedModuleConfig) return;

    const headers = selectedModuleConfig.fields.join(',');
    const csvContent = `data:text/csv;charset=utf-8,${encodeURIComponent(headers)}`;

    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `${selectedModule}_template.csv`);
    link.click();
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        alert('Please select a CSV file');
        return;
      }
      setUploadedFile(file);
      setUploadResult(null);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedModule) {
      alert('Please select a module');
      return;
    }
    if (!uploadedFile) {
      alert('Please select a file to upload');
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append('csvFile', uploadedFile);

    try {
      const response = await fetch(`http://localhost:5000/api/bulk-upload/${selectedModule}`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setUploadResult({
          success: true,
          message: `Successfully imported ${result.imported} records. ${result.failed > 0 ? `${result.failed} records failed.` : ''}`,
          imported: result.imported,
          failed: result.failed,
          errors: result.errors || [],
        });
      } else {
        setUploadResult({
          success: false,
          message: result.error || 'Upload failed',
          errors: [],
        });
      }

      setUploadedFile(null);
      document.getElementById('fileInput').value = '';
    } catch (error) {
      setUploadResult({
        success: false,
        message: `Error: ${error.message}`,
        errors: [],
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bulk-upload-container">
      <div className="bulk-upload-card">
        <h2>📥 Bulk Upload</h2>
        <p className="subtitle">Upload multiple records at once by selecting a module and uploading a CSV file.</p>

        {/* Module Selection */}
        <div className="form-group">
          <label htmlFor="moduleSelect">Select Module: *</label>
          <select
            id="moduleSelect"
            value={selectedModule}
            onChange={handleModuleChange}
            className="form-select"
          >
            <option value="">-- Choose a Module --</option>
            {modules.map(mod => (
              <option key={mod.value} value={mod.value}>
                {mod.label}
              </option>
            ))}
          </select>
        </div>

        {/* Template Info & Download */}
        {selectedModuleConfig && (
          <div className="template-section">
            <div className="template-info">
              <h4>📋 Expected CSV Format for {selectedModuleConfig.label}</h4>
              <p className="fields-list">
                <strong>Fields:</strong> {selectedModuleConfig.fields.join(', ')}
              </p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="btn btn-download"
              disabled={!selectedModule}
            >
              ⬇️ Download Template
            </button>
          </div>
        )}

        {/* File Upload */}
        {selectedModule && (
          <div className="upload-section">
            <div className="form-group">
              <label htmlFor="fileInput">Select CSV File: *</label>
              <input
                id="fileInput"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="file-input"
              />
              {uploadedFile && (
                <p className="file-name">✓ Selected: {uploadedFile.name}</p>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={!uploadedFile || isUploading}
              className="btn btn-upload"
            >
              {isUploading ? '⏳ Uploading...' : '📤 Upload File'}
            </button>
          </div>
        )}

        {/* Upload Result */}
        {uploadResult && (
          <div className={`result-section ${uploadResult.success ? 'success' : 'error'}`}>
            <h4>{uploadResult.success ? '✅ Success' : '❌ Error'}</h4>
            <p>{uploadResult.message}</p>

            {uploadResult.success && (
              <div className="result-stats">
                <span className="stat-box imported">
                  <strong>Imported:</strong> {uploadResult.imported}
                </span>
                {uploadResult.failed > 0 && (
                  <span className="stat-box failed">
                    <strong>Failed:</strong> {uploadResult.failed}
                  </span>
                )}
              </div>
            )}

            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <div className="error-list">
                <h5>Errors:</h5>
                <ul>
                  {uploadResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkUpload;
