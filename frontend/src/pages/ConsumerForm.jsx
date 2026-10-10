import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import PhotoUploadField from '../components/PhotoUploadField';
import api from '../services/api';

const PLANT_CAPACITIES = ['1 KW','2 KW','3 KW','4 KW','5 KW','6 KW','7 KW','8 KW','9 KW','10 KW'];

const initialForm = {
  consumerName: '', consumerNo: '', contactNumber: '', applicationRefNo: '',
  subDivision: '', address: '', plantCapacity: '', installationDate: '', commissioningDate: '',
};

const initialPhotos = {
  inverterPhoto: null, panelPhoto: null, earthPhoto: null, laPhoto: null, additionalPhoto: null,
};

const initialPhotoErrors = {
  inverterPhoto: '', panelPhoto: '', earthPhoto: '', laPhoto: '', additionalPhoto: '',
};

export default function ConsumerForm() {
  const [form, setForm] = useState(initialForm);
  const [photos, setPhotos] = useState(initialPhotos);
  const [photoErrors, setPhotoErrors] = useState(initialPhotoErrors);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // {type: 'success'|'error', message: ''}
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handlePhotoChange = (field, file, err) => {
    setPhotos(prev => ({ ...prev, [field]: file }));
    setPhotoErrors(prev => ({ ...prev, [field]: err || '' }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.consumerName.trim()) newErrors.consumerName = 'Consumer Name is required.';
    if (!form.consumerNo.trim()) newErrors.consumerNo = 'Consumer No is required.';
    if (!form.contactNumber.trim()) newErrors.contactNumber = 'Contact Number is required.';
    if (!form.applicationRefNo.trim()) newErrors.applicationRefNo = 'Application Reference No is required.';
    if (!form.subDivision.trim()) newErrors.subDivision = 'Sub-Division is required.';
    if (!form.address.trim()) newErrors.address = 'Address is required.';
    if (!form.plantCapacity) newErrors.plantCapacity = 'Plant Capacity is required.';
    if (!form.installationDate) newErrors.installationDate = 'Installation Date is required.';

    const newPhotoErrors = { ...initialPhotoErrors };
    if (!photos.inverterPhoto) newPhotoErrors.inverterPhoto = 'Inverter Photo is required.';
    if (!photos.panelPhoto) newPhotoErrors.panelPhoto = 'Panel Photo is required.';
    if (!photos.earthPhoto) newPhotoErrors.earthPhoto = 'Earth Photo is required.';
    if (!photos.laPhoto) newPhotoErrors.laPhoto = 'LA Photo is required.';

    setErrors(newErrors);
    setPhotoErrors(newPhotoErrors);

    return Object.keys(newErrors).length === 0 &&
      !newPhotoErrors.inverterPhoto && !newPhotoErrors.panelPhoto &&
      !newPhotoErrors.earthPhoto && !newPhotoErrors.laPhoto;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus(null);

    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
      formData.append('vendorName', 'DRT ENTERPRISE');

      Object.entries(photos).forEach(([key, file]) => {
        if (file) formData.append(key, file);
      });

      setUploadProgress(30);

      await api.post('/api/records', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const pct = Math.round((progressEvent.loaded * 60) / progressEvent.total);
          setUploadProgress(30 + pct);
        },
      });

      setUploadProgress(100);
      setSubmitStatus({ type: 'success', message: 'Record submitted successfully! The installation record has been saved.' });
      setForm(initialForm);
      setPhotos(initialPhotos);
      setPhotoErrors(initialPhotoErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      const msg = err.response?.data?.message || 'Submission failed. Please try again.';
      setSubmitStatus({ type: 'error', message: msg });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleReset = () => {
    if (!window.confirm('Reset the form? All entered data will be cleared.')) return;
    setForm(initialForm);
    setPhotos(initialPhotos);
    setPhotoErrors(initialPhotoErrors);
    setErrors({});
    setSubmitStatus(null);
  };

  return (
    <>
      <Navbar adminMode={false} />

      <div className="page-header">
        <div className="container">
          <div className="d-flex align-items-center gap-3">
            <img src="/assets/pm.png" alt="PM Surya Ghar" height="60"
              onError={(e) => { e.target.style.display = 'none'; }} />
            <div>
              <h1 className="mb-0"><i className="bi bi-sun me-2"></i>Solar Installation Registration</h1>
              <p className="mb-0">PM Surya Ghar — DRT Enterprise Solar Energy Solutions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container pb-5">
        {submitStatus && (
          <div className={`alert-banner alert alert-${submitStatus.type === 'success' ? 'success' : 'danger'} mb-4`}>
            <i className={`bi bi-${submitStatus.type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill'} fs-5`}></i>
            <div>
              <strong>{submitStatus.type === 'success' ? 'Success!' : 'Error'}</strong>
              <div>{submitStatus.message}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* ─── SECTION A: Consumer Information ─────────────────────────────── */}
          <div className="drt-card mb-4">
            <div className="drt-card-header">
              <i className="bi bi-person-fill"></i>
              Section A — Consumer Information
            </div>
            <div className="drt-card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="consumerName" className="form-label">Consumer Name <span className="text-danger">*</span></label>
                  <input id="consumerName" name="consumerName" type="text"
                    className={`form-control ${errors.consumerName ? 'is-invalid' : ''}`}
                    value={form.consumerName} onChange={handleChange}
                    placeholder="Enter full consumer name" />
                  {errors.consumerName && <div className="invalid-feedback">{errors.consumerName}</div>}
                </div>

                <div className="col-md-6">
                  <label htmlFor="consumerNo" className="form-label">Consumer No <span className="text-danger">*</span></label>
                  <input id="consumerNo" name="consumerNo" type="text"
                    className={`form-control ${errors.consumerNo ? 'is-invalid' : ''}`}
                    value={form.consumerNo} onChange={handleChange}
                    placeholder="e.g. 12345678" />
                  {errors.consumerNo && <div className="invalid-feedback">{errors.consumerNo}</div>}
                </div>

                <div className="col-md-6">
                  <label htmlFor="contactNumber" className="form-label">Contact Number <span className="text-danger">*</span></label>
                  <input id="contactNumber" name="contactNumber" type="tel"
                    className={`form-control ${errors.contactNumber ? 'is-invalid' : ''}`}
                    value={form.contactNumber} onChange={handleChange}
                    placeholder="+91 XXXXXXXXXX" />
                  {errors.contactNumber && <div className="invalid-feedback">{errors.contactNumber}</div>}
                </div>

                <div className="col-md-6">
                  <label htmlFor="applicationRefNo" className="form-label">Application Reference No <span className="text-danger">*</span></label>
                  <input id="applicationRefNo" name="applicationRefNo" type="text"
                    className={`form-control ${errors.applicationRefNo ? 'is-invalid' : ''}`}
                    value={form.applicationRefNo} onChange={handleChange}
                    placeholder="e.g. APP-2024-001" />
                  {errors.applicationRefNo && <div className="invalid-feedback">{errors.applicationRefNo}</div>}
                </div>

                <div className="col-md-6">
                  <label htmlFor="subDivision" className="form-label">Sub-Division <span className="text-danger">*</span></label>
                  <input id="subDivision" name="subDivision" type="text"
                    className={`form-control ${errors.subDivision ? 'is-invalid' : ''}`}
                    value={form.subDivision} onChange={handleChange}
                    placeholder="Enter sub-division name" />
                  {errors.subDivision && <div className="invalid-feedback">{errors.subDivision}</div>}
                </div>

                <div className="col-12">
                  <label htmlFor="address" className="form-label">Address <span className="text-danger">*</span></label>
                  <textarea id="address" name="address" rows={3}
                    className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                    value={form.address} onChange={handleChange}
                    placeholder="Enter complete postal address" />
                  {errors.address && <div className="invalid-feedback">{errors.address}</div>}
                </div>
              </div>
            </div>
          </div>

          {/* ─── SECTION B: Installation Details ─────────────────────────────── */}
          <div className="drt-card mb-4">
            <div className="drt-card-header">
              <i className="bi bi-lightning-fill"></i>
              Section B — Installation Details
            </div>
            <div className="drt-card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="plantCapacity" className="form-label">Plant Capacity <span className="text-danger">*</span></label>
                  <select id="plantCapacity" name="plantCapacity"
                    className={`form-select ${errors.plantCapacity ? 'is-invalid' : ''}`}
                    value={form.plantCapacity} onChange={handleChange}>
                    <option value="">— Select Capacity —</option>
                    {PLANT_CAPACITIES.map(cap => (
                      <option key={cap} value={cap}>{cap}</option>
                    ))}
                  </select>
                  {errors.plantCapacity && <div className="invalid-feedback">{errors.plantCapacity}</div>}
                </div>

                <div className="col-md-6">
                  <label htmlFor="vendorName" className="form-label">Vendor Name</label>
                  <input id="vendorName" type="text" className="form-control"
                    value="DRT ENTERPRISE" readOnly
                    style={{ background: '#f0f4f8', cursor: 'not-allowed', fontWeight: 600 }} />
                </div>

                <div className="col-md-6">
                  <label htmlFor="installationDate" className="form-label">Installation Date <span className="text-danger">*</span></label>
                  <input id="installationDate" name="installationDate" type="date"
                    className={`form-control ${errors.installationDate ? 'is-invalid' : ''}`}
                    value={form.installationDate} onChange={handleChange} />
                  {errors.installationDate && <div className="invalid-feedback">{errors.installationDate}</div>}
                </div>

                <div className="col-md-6">
                  <label htmlFor="commissioningDate" className="form-label">
                    Date of System Commissioning
                    <span className="badge bg-secondary ms-2 fw-normal" style={{ fontSize: '0.7rem' }}>Optional</span>
                  </label>
                  <input id="commissioningDate" name="commissioningDate" type="date"
                    className="form-control"
                    value={form.commissioningDate} onChange={handleChange} />
                </div>
              </div>
            </div>
          </div>

          {/* ─── SECTION C: Photographs ───────────────────────────────────────── */}
          <div className="drt-card mb-4">
            <div className="drt-card-header">
              <i className="bi bi-camera-fill"></i>
              Section C — Installation Photographs
            </div>
            <div className="drt-card-body">
              <div className="alert alert-info mb-4" style={{ borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>
                <i className="bi bi-info-circle me-2"></i>
                Please upload clear photographs. All photos except "Additional Photo" are mandatory. Max 10MB per image (JPG, PNG, WebP).
              </div>

              <div className="row g-4">
                <div className="col-md-6">
                  <PhotoUploadField id="upload-inverter" label="Inverter Photo" required
                    value={null} onChange={(f, e) => handlePhotoChange('inverterPhoto', f, e)}
                    error={photoErrors.inverterPhoto} />
                </div>
                <div className="col-md-6">
                  <PhotoUploadField id="upload-panel" label="Panel Photo" required
                    value={null} onChange={(f, e) => handlePhotoChange('panelPhoto', f, e)}
                    error={photoErrors.panelPhoto} />
                </div>
                <div className="col-md-6">
                  <PhotoUploadField id="upload-earth" label="Earth Photo" required
                    value={null} onChange={(f, e) => handlePhotoChange('earthPhoto', f, e)}
                    error={photoErrors.earthPhoto} />
                </div>
                <div className="col-md-6">
                  <PhotoUploadField id="upload-la" label="LA Photo" required
                    value={null} onChange={(f, e) => handlePhotoChange('laPhoto', f, e)}
                    error={photoErrors.laPhoto} />
                </div>
                <div className="col-md-6">
                  <PhotoUploadField id="upload-additional" label="Additional Photo"
                    value={null} onChange={(f, e) => handlePhotoChange('additionalPhoto', f, e)}
                    error={photoErrors.additionalPhoto} />
                </div>
              </div>
            </div>
          </div>

          {/* Upload progress */}
          {submitting && uploadProgress > 0 && (
            <div className="mb-4">
              <div className="d-flex justify-content-between mb-1">
                <small className="fw-semibold text-muted">Uploading record...</small>
                <small className="fw-semibold">{uploadProgress}%</small>
              </div>
              <div className="progress" style={{ height: '8px', borderRadius: '4px' }}>
                <div className="progress-bar progress-bar-striped progress-bar-animated bg-primary"
                  role="progressbar" style={{ width: `${uploadProgress}%` }}
                  aria-valuenow={uploadProgress} aria-valuemin="0" aria-valuemax="100" />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="d-flex gap-3 justify-content-end">
            <button type="button" className="btn btn-outline-secondary px-4"
              onClick={handleReset} disabled={submitting}>
              <i className="bi bi-arrow-counterclockwise me-2"></i>Reset
            </button>
            <button type="submit" className="btn-solar btn px-5"
              disabled={submitting} id="submit-btn">
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Submitting...
                </>
              ) : (
                <>
                  <i className="bi bi-send-fill me-2"></i>Submit Record
                </>
              )}
            </button>
          </div>

        </form>

        {/* Footer note */}
        <div className="text-center mt-5 pt-3 border-top">
          <small className="text-muted">
            <i className="bi bi-shield-check me-1"></i>
            Your information is securely stored. For support contact:&nbsp;
            <a href="tel:+917002322258" className="text-decoration-none">+91 7002322258</a>
          </small>
        </div>
      </div>
    </>
  );
}
