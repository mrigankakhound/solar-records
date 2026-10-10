import React, { useState, useRef } from 'react';

const ACCEPTED = 'image/jpeg,image/jpg,image/png,image/webp';
const MAX_SIZE_MB = 10;

const PhotoUploadField = ({ id, label, required = false, value, onChange, error }) => {
  const [preview, setPreview] = useState(value?.preview || null);
  const inputRef = useRef();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      onChange(null, `File too large. Max ${MAX_SIZE_MB}MB allowed.`);
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      onChange(null, 'Invalid file type. Only JPG, PNG, and WebP allowed.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      onChange(file, null);
    };
    reader.readAsDataURL(file);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setPreview(null);
    onChange(null, null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleClick = () => inputRef.current?.click();

  return (
    <div className="mb-3">
      <label className="form-label">
        {label}
        {required && <span className="text-danger ms-1">*</span>}
      </label>

      <div
        className={`photo-upload-area ${preview ? 'has-image' : ''} ${error ? 'is-invalid' : ''}`}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        id={id}
      >
        {preview ? (
          <>
            <img src={preview} alt={label} className="photo-preview" />
            <div className="mt-2">
              <span className="badge bg-success me-2">
                <i className="bi bi-check-circle me-1"></i>Image selected
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={handleClear}
              >
                <i className="bi bi-x-circle me-1"></i>Remove
              </button>
            </div>
          </>
        ) : (
          <div className="upload-placeholder">
            <i className="bi bi-cloud-arrow-up"></i>
            <div className="fw-semibold" style={{ color: 'var(--primary)' }}>
              Click to upload {label}
            </div>
            <small className="text-muted">JPG, PNG, WebP • Max 10MB</small>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-label={`Upload ${label}`}
      />

      {error && <div className="invalid-feedback d-block">{error}</div>}
    </div>
  );
};

export default PhotoUploadField;
