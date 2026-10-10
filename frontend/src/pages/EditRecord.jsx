import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

const PLANT_CAPACITIES = ['1 KW','2 KW','3 KW','4 KW','5 KW','6 KW','7 KW','8 KW','9 KW','10 KW'];

const toInputDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};

const PhotoEditField = ({ label, required, currentUrl, onFileChange, fieldName }) => {
  const [preview, setPreview] = useState(null);
  const [newFile, setNewFile] = useState(null);

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Max 10MB.');
      return;
    }
    const allowed = ['image/jpeg','image/jpg','image/png','image/webp'];
    if (!allowed.includes(file.type)) {
      alert('Invalid file type. Use JPG, PNG, or WebP.');
      return;
    }
    setNewFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
    onFileChange(file);
  };

  return (
    <div className="mb-3">
      <label className="form-label fw-semibold" style={{ color: 'var(--primary)', fontSize: '0.875rem' }}>
        {label}{required && <span className="text-danger ms-1">*</span>}
      </label>

      {/* Current image */}
      {currentUrl && !preview && (
        <div className="mb-2">
          <img src={currentUrl} alt={label}
            style={{ maxHeight: '180px', maxWidth: '100%', objectFit: 'contain',
              border: '1px solid var(--border)', borderRadius: '6px', padding: '4px' }} />
          <div className="mt-1"><small className="text-muted">Current image</small></div>
        </div>
      )}

      {/* New preview */}
      {preview && (
        <div className="mb-2">
          <img src={preview} alt={`New ${label}`}
            style={{ maxHeight: '180px', maxWidth: '100%', objectFit: 'contain',
              border: '1px solid var(--success)', borderRadius: '6px', padding: '4px' }} />
          <div className="mt-1"><span className="badge bg-success">New image selected</span></div>
        </div>
      )}

      <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
        className="form-control form-control-sm" onChange={handleChange}
        id={`edit-photo-${fieldName}`}
        aria-label={`Replace ${label}`} />
      <small className="text-muted">{currentUrl ? 'Upload to replace existing photo' : 'Upload photo'} (JPG, PNG, WebP, max 10MB)</small>
    </div>
  );
};

export default function EditRecord() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState(null);
  const [form, setForm] = useState({});
  const [newPhotos, setNewPhotos] = useState({});

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/api/records/${id}`);
        if (res.data.success) {
          const r = res.data.data;
          setRecord(r);
          setForm({
            consumerName: r.consumerName || '',
            consumerNo: r.consumerNo || '',
            contactNumber: r.contactNumber || '',
            applicationRefNo: r.applicationRefNo || '',
            subDivision: r.subDivision || '',
            address: r.address || '',
            plantCapacity: r.plantCapacity || '',
            installationDate: toInputDate(r.installationDate),
            commissioningDate: toInputDate(r.commissioningDate),
          });
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load record.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (field, file) => {
    setNewPhotos(prev => ({ ...prev, [field]: file }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveStatus(null);

    if (!form.consumerName?.trim()) { setSaveStatus({ type: 'error', message: 'Consumer Name is required.' }); return; }
    if (!form.plantCapacity || !PLANT_CAPACITIES.includes(form.plantCapacity)) { setSaveStatus({ type: 'error', message: 'Invalid plant capacity.' }); return; }
    if (!form.installationDate) { setSaveStatus({ type: 'error', message: 'Installation Date is required.' }); return; }

    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== undefined && v !== null) formData.append(k, v);
      });
      formData.append('vendorName', 'DRT ENTERPRISE');

      Object.entries(newPhotos).forEach(([k, file]) => {
        if (file) formData.append(k, file);
      });

      await api.put(`/api/records/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSaveStatus({ type: 'success', message: 'Record updated successfully!' });
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      setSaveStatus({ type: 'error', message: err.response?.data?.message || 'Update failed.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <>
      <Navbar adminMode />
      <div className="loading-overlay"><div className="spinner-border text-primary"></div><p className="mt-3">Loading...</p></div>
    </>
  );

  if (error || !record) return (
    <>
      <Navbar adminMode />
      <div className="container mt-5">
        <div className="alert alert-danger">{error || 'Record not found.'}</div>
        <button className="btn btn-outline-primary" onClick={() => navigate('/admin')}>← Back</button>
      </div>
    </>
  );

  return (
    <>
      <Navbar adminMode />

      <div className="page-header">
        <div className="container">
          <button className="btn btn-sm btn-outline-light mb-2" onClick={() => navigate(`/admin/records/${id}`)}>
            <i className="bi bi-arrow-left me-1"></i>Back to Details
          </button>
          <h1><i className="bi bi-pencil-square me-2"></i>Edit Record</h1>
          <p className="mb-0">{record.consumerName} — {record.consumerNo}</p>
        </div>
      </div>

      <div className="container pb-5">
        {saveStatus && (
          <div className={`alert alert-${saveStatus.type === 'success' ? 'success' : 'danger'} d-flex align-items-center gap-2 mb-4`}>
            <i className={`bi bi-${saveStatus.type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill'}`}></i>
            {saveStatus.message}
            {saveStatus.type === 'success' && (
              <button className="btn btn-sm btn-outline-success ms-auto" onClick={() => navigate(`/admin/records/${id}`)}>
                View Record
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSave} noValidate>

          {/* Consumer Info */}
          <div className="drt-card mb-4">
            <div className="drt-card-header"><i className="bi bi-person-fill me-2"></i>Consumer Information</div>
            <div className="drt-card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="edit-consumerName" className="form-label">Consumer Name <span className="text-danger">*</span></label>
                  <input id="edit-consumerName" name="consumerName" type="text" className="form-control"
                    value={form.consumerName} onChange={handleChange} />
                </div>
                <div className="col-md-6">
                  <label htmlFor="edit-consumerNo" className="form-label">Consumer No <span className="text-danger">*</span></label>
                  <input id="edit-consumerNo" name="consumerNo" type="text" className="form-control"
                    value={form.consumerNo} onChange={handleChange} />
                </div>
                <div className="col-md-6">
                  <label htmlFor="edit-contactNumber" className="form-label">Contact Number</label>
                  <input id="edit-contactNumber" name="contactNumber" type="tel" className="form-control"
                    value={form.contactNumber} onChange={handleChange} />
                </div>
                <div className="col-md-6">
                  <label htmlFor="edit-applicationRefNo" className="form-label">Application Reference No</label>
                  <input id="edit-applicationRefNo" name="applicationRefNo" type="text" className="form-control"
                    value={form.applicationRefNo} onChange={handleChange} />
                </div>
                <div className="col-md-6">
                  <label htmlFor="edit-subDivision" className="form-label">Sub-Division</label>
                  <input id="edit-subDivision" name="subDivision" type="text" className="form-control"
                    value={form.subDivision} onChange={handleChange} />
                </div>
                <div className="col-12">
                  <label htmlFor="edit-address" className="form-label">Address</label>
                  <textarea id="edit-address" name="address" rows={3} className="form-control"
                    value={form.address} onChange={handleChange} />
                </div>
              </div>
            </div>
          </div>

          {/* Installation Details */}
          <div className="drt-card mb-4">
            <div className="drt-card-header"><i className="bi bi-lightning-fill me-2"></i>Installation Details</div>
            <div className="drt-card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="edit-plantCapacity" className="form-label">Plant Capacity <span className="text-danger">*</span></label>
                  <select id="edit-plantCapacity" name="plantCapacity" className="form-select"
                    value={form.plantCapacity} onChange={handleChange}>
                    <option value="">— Select —</option>
                    {PLANT_CAPACITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Vendor Name</label>
                  <input type="text" className="form-control" value="DRT ENTERPRISE" readOnly
                    style={{ background: '#f0f4f8', cursor: 'not-allowed', fontWeight: 600 }} />
                </div>
                <div className="col-md-6">
                  <label htmlFor="edit-installationDate" className="form-label">Installation Date <span className="text-danger">*</span></label>
                  <input id="edit-installationDate" name="installationDate" type="date" className="form-control"
                    value={form.installationDate} onChange={handleChange} />
                </div>
                <div className="col-md-6">
                  <label htmlFor="edit-commissioningDate" className="form-label">Date of System Commissioning <small className="text-muted">(optional)</small></label>
                  <input id="edit-commissioningDate" name="commissioningDate" type="date" className="form-control"
                    value={form.commissioningDate} onChange={handleChange} />
                </div>
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className="drt-card mb-4">
            <div className="drt-card-header"><i className="bi bi-camera-fill me-2"></i>Photographs</div>
            <div className="drt-card-body">
              <div className="alert alert-info mb-4" style={{ fontSize: '0.875rem' }}>
                <i className="bi bi-info-circle me-2"></i>
                Leave a photo field empty to keep the existing image. Upload a new file to replace it.
              </div>
              <div className="row g-4">
                <div className="col-md-6">
                  <PhotoEditField label="Inverter Photo" required currentUrl={record.inverterPhoto?.url}
                    onFileChange={(f) => handlePhotoChange('inverterPhoto', f)} fieldName="inverterPhoto" />
                </div>
                <div className="col-md-6">
                  <PhotoEditField label="Panel Photo" required currentUrl={record.panelPhoto?.url}
                    onFileChange={(f) => handlePhotoChange('panelPhoto', f)} fieldName="panelPhoto" />
                </div>
                <div className="col-md-6">
                  <PhotoEditField label="Earth Photo" required currentUrl={record.earthPhoto?.url}
                    onFileChange={(f) => handlePhotoChange('earthPhoto', f)} fieldName="earthPhoto" />
                </div>
                <div className="col-md-6">
                  <PhotoEditField label="LA Photo" required currentUrl={record.laPhoto?.url}
                    onFileChange={(f) => handlePhotoChange('laPhoto', f)} fieldName="laPhoto" />
                </div>
                <div className="col-md-6">
                  <PhotoEditField label="Additional Photo" currentUrl={record.additionalPhoto?.url}
                    onFileChange={(f) => handlePhotoChange('additionalPhoto', f)} fieldName="additionalPhoto" />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="d-flex gap-3 justify-content-end">
            <button type="button" className="btn btn-outline-secondary px-4"
              onClick={() => navigate(`/admin/records/${id}`)}>Cancel</button>
            <button type="submit" className="btn-solar btn px-5" disabled={saving} id="save-record-btn">
              {saving
                ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
                : <><i className="bi bi-save me-2"></i>Save Changes</>}
            </button>
          </div>

        </form>
      </div>
    </>
  );
}
