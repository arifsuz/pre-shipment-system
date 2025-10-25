// frontend/src/components/upload/ExcelUpload.tsx
import React, { useState, useMemo } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { api } from '../../services/api';
import type { CreateShipmentData } from '../../types';

// Response shape for Excel upload
export interface ExcelUploadResponse {
  success: boolean;
  message: string;
  // can be single CreateShipmentData or array of them
  data?: CreateShipmentData | CreateShipmentData[];
  warnings?: string[];
  errors?: string[];
}

interface ExcelUploadProps {
  onDataParsed: (data: CreateShipmentData) => void;
  onCancel: () => void;
}

interface UploadState {
  isDragging: boolean;
  isUploading: boolean;
  file: File | null;
  result: any;
  errors: string[];
  warnings: string[];
}

export const ExcelUpload: React.FC<ExcelUploadProps> = ({ onDataParsed, onCancel }) => {
  const [state, setState] = useState<UploadState>({
    isDragging: false,
    isUploading: false,
    file: null,
    result: null,
    errors: [],
    warnings: []
  });
  const [selectedCaseIndex, setSelectedCaseIndex] = useState<number>(0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, isDragging: true }));
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, isDragging: false }));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, isDragging: false }));

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    // Validasi file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];

    if (!validTypes.includes(file.type)) {
      setState(prev => ({
        ...prev,
        errors: ['Hanya file Excel yang diizinkan (.xlsx, .xls)']
      }));
      return;
    }

    // Validasi size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setState(prev => ({
        ...prev,
        errors: ['Ukuran file terlalu besar. Maksimal 10MB']
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      file,
      errors: [],
      result: null
    }));
  };

  // add this function to fix ReferenceError
  const resetUpload = () => {
    // clear the hidden file input so same file can be re-selected
    const input = document.getElementById('excel-upload') as HTMLInputElement | null;
    if (input) input.value = '';

    setState(prev => ({
      ...prev,
      isDragging: false,
      isUploading: false,
      file: null,
      result: null,
      errors: [],
      warnings: []
    }));
    setSelectedCaseIndex(0);
  };
  
  const handleUpload = async () => {
    if (!state.file) return;

    setState(prev => ({ ...prev, isUploading: true, errors: [] }));

    try {
      const formData = new FormData();
      formData.append('file', state.file);

      // DO NOT set 'Content-Type' manually. Let the browser set boundary.
      const response = await api.post('/upload/excel', formData);

      if (response.data?.success) {
        setState(prev => ({
          ...prev,
          result: response.data,
          warnings: response.data.warnings || [],
          errors: []
        }));
      } else {
        setState(prev => ({
          ...prev,
          errors: response.data?.errors ?? [response.data?.message ?? 'Gagal memproses file Excel']
        }));
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      const resp = error.response?.data;
      const serverErrors = resp?.errors ?? (resp?.message ? [resp.message] : undefined);
      setState(prev => ({
        ...prev,
        errors: serverErrors ?? [error.message ?? 'Terjadi kesalahan saat upload']
      }));
    } finally {
      setState(prev => ({ ...prev, isUploading: false }));
    }
  };

  // previewData: jika backend mengembalikan array, ambil elemen yang dipilih
  const previewData = useMemo(() => {
    const raw = state.result?.data;
    if (!raw) return null;
    return Array.isArray(raw) ? (raw[selectedCaseIndex] ?? raw[0]) : raw;
  }, [state.result, selectedCaseIndex]);

  const handleUseData = () => {
    if (!state.result?.data) return;
    const raw = state.result.data;
    const chosen = Array.isArray(raw) ? (raw[selectedCaseIndex] ?? raw[0]) : raw;
    onDataParsed(chosen);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-primary-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Upload Excel File</h2>
              <p className="text-sm text-gray-500">Upload file Excel untuk import data shipment</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Upload Area */}
          {!state.file && !state.result && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                state.isDragging
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-primary-600">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Excel files only (.xlsx, .xls) • Max 10MB
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                id="excel-upload"
                accept=".xlsx,.xls"
                onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
              />
              <Button
                variant="secondary"
                className="mt-4"
                onClick={() => document.getElementById('excel-upload')?.click()}
              >
                Select File
              </Button>
            </div>
          )}

          {/* Selected File */}
          {state.file && !state.result && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{state.file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(state.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={resetUpload}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Errors */}
          {state.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-red-800">Error</h4>
                  <ul className="mt-2 text-sm text-red-700 space-y-1">
                    {state.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Warnings */}
          {state.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-yellow-800">Warning</h4>
                  <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                    {state.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Success Result */}
          {state.result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-green-800">Success</h4>
                  <p className="mt-1 text-sm text-green-700">
                    File berhasil diproses. Data shipment siap digunakan.
                  </p>

                  {/* Preview Data */}
                  <div className="mt-4 p-3 bg-white rounded border">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Preview Data:</h5>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><strong>Order No:</strong> {previewData?.orderNo ?? '—'}</div>
                      <div><strong>Shipping Mark:</strong> {previewData?.shippingMark ?? '—'}</div>
                      <div><strong>Destination:</strong> {previewData?.destination ?? '—'}</div>
                      <div><strong>Items:</strong> {previewData?.items ? previewData.items.length : 0} items</div>
                      {Array.isArray(state.result?.data) && (
                        <div className="text-xs text-gray-500 mt-1">
                          Multiple cases found ({(state.result?.data as any[]).length}). Showing selected case.
                        </div>
                      )}
                    </div>

                    {/* selector when multiple cases */}
                    {Array.isArray(state.result?.data) && (state.result?.data as any[]).length > 1 && (
                      <div className="flex items-center gap-2 mt-2">
                        <label className="text-sm">Select case:</label>
                        <select
                          value={selectedCaseIndex}
                          onChange={(e) => setSelectedCaseIndex(Number(e.target.value))}
                          className="border rounded px-2 py-1"
                        >
                          {(state.result?.data as any[]).map((d, idx) => (
                            <option key={idx} value={idx}>
                              {d.caseNo ? `${d.caseNo} — ${d.orderNo ?? ''}` : `Case ${idx + 1}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>

          {state.file && !state.result && (
            <Button
              onClick={handleUpload}
              loading={state.isUploading}
              disabled={!state.file || state.isUploading}
            >
              Process File
            </Button>
          )}

          {state.result && (
            <Button onClick={handleUseData}>
              Use This Data
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};