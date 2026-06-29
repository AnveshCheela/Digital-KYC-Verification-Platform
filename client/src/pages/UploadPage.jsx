import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { uploadDocument } from '../api/kycApi';
import toast from 'react-hot-toast';

export default function UploadPage() {
  const [documentType, setDocumentType] = useState('aadhaar');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please upload a file');
      return;
    }

    try {
      setLoading(true);
      const data = await uploadDocument(file, documentType);
      toast.success('Document uploaded successfully');
      navigate(`/status/${data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full px-gutter max-w-[640px] mx-auto py-xl flex flex-col flex-grow items-center">
      <div className="w-full mb-lg text-center">
        <h1 className="font-headline-lg text-headline-lg text-primary mb-xs">Submit Document</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Upload your KYC document for verification.</p>
      </div>

      <div className="w-full bg-surface-container-lowest border border-surface-border rounded-xl p-lg md:p-xl shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-on-surface-variant">Document Type</label>
            <select 
              value={documentType} 
              onChange={(e) => setDocumentType(e.target.value)}
              className="border border-outline-variant rounded p-sm bg-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
            >
              <option value="aadhaar">Aadhaar Card</option>
              <option value="pan">PAN Card</option>
              <option value="passport">Passport</option>
            </select>
          </div>

          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-on-surface-variant">Upload File</label>
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-xl p-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? 'border-secondary bg-secondary-fixed' : 'border-outline-variant bg-surface hover:bg-surface-container'}`}
            >
              <input {...getInputProps()} />
              <span className="material-symbols-outlined text-[48px] text-secondary mb-sm">cloud_upload</span>
              <p className="font-body-md text-on-surface-variant text-center">
                {isDragActive ? 'Drop the file here...' : 'Drag & drop your file here, or click to select'}
              </p>
              <p className="font-body-sm text-outline mt-xs">Supports: JPG, PNG, PDF (Max 5MB)</p>
            </div>
            {file && (
              <div className="mt-sm p-sm bg-surface-container-low border border-surface-border rounded flex items-center justify-between">
                <span className="font-body-sm text-on-surface truncate">{file.name}</span>
                <button type="button" onClick={() => setFile(null)} className="text-error hover:opacity-80">
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading || !file}
            className="w-full bg-secondary text-on-secondary py-md rounded font-label-md mt-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Verification'}
          </button>
        </form>
      </div>
    </div>
  );
}
