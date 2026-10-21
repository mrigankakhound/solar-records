import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const PhotoCard = ({ title, photo }) => {
  if (!photo || !photo.url) return null;
  return (
    <div className="col-md-6 mb-3">
      <div className="photo-card">
        <div className="photo-card-header">
          <i className="bi bi-camera me-2"></i>{title}
        </div>
        <img src={photo.url} alt={title} />
      </div>
    </div>
  );
};

export default function RecordDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/api/records/${id}`);
        if (res.data.success) setRecord(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load record.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleDownloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      const res = await api.get(`/api/records/${id}/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = record.consumerName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
      a.download = `DRT_Solar_${safeName}_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      // When responseType:'blob', error bodies also arrive as Blobs — parse them to get the real message.
      let msg = 'PDF generation failed. Please try again.';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json?.message) msg = json.message;
        } catch { /* blob was not JSON — keep generic message */ }
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.message) {
        msg = err.message;
      }
      alert(msg);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete record for "${record.consumerName}"?\n\nThis action is permanent and will also delete all photographs.`)) return;
    setDeletingRecord(true);
    try {
      await api.delete(`/api/records/${id}`);
      navigate('/admin', { replace: true });
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
      setDeletingRecord(false);
    }
  };

  if (loading) return (
    <>
      <Navbar adminMode />
      <div className="loading-overlay"><div className="spinner-border text-primary"></div><p className="mt-3">Loading...</p></div>
    </>
  );

  if (error) return (
    <>
      <Navbar adminMode />
      <div className="container mt-5">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-outline-primary" onClick={() => navigate('/admin')}>← Back</button>
      </div>
    </>
  );

  return (
    <>
      <Navbar adminMode />

      <div className="page-header">
        <div className="container">
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
            <div>
              <button className="btn btn-sm btn-outline-light mb-2" onClick={() => navigate('/admin')}>
                <i className="bi bi-arrow-left me-1"></i>Back to Dashboard
              </button>
              <h1 className="mb-0"><i className="bi bi-person-badge me-2"></i>{record.consumerName}</h1>
              <p className="mb-0">Consumer No: {record.consumerNo}</p>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <button className="btn btn-warning" onClick={() => navigate(`/admin/records/${id}/edit`)} id="edit-record-btn">
                <i className="bi bi-pencil-fill me-2"></i>Edit
              </button>
              <button className="btn btn-success" onClick={handleDownloadPDF} disabled={downloadingPDF} id="download-pdf-btn">
                {downloadingPDF ? <><span className="spinner-border spinner-border-sm me-2"></span>Generating...</>
                  : <><i className="bi bi-file-earmark-pdf me-2"></i>Download PDF</>}
              </button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={deletingRecord} id="delete-record-btn">
                {deletingRecord ? <span className="spinner-border spinner-border-sm"></span>
                  : <><i className="bi bi-trash me-2"></i>Delete</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container pb-5">

        {/* ── Consumer Info ─────────────────────────────────────────────────── */}
        <div className="drt-card mb-4">
          <div className="drt-card-header"><i className="bi bi-person-fill me-2"></i>Consumer Information</div>
          <div className="drt-card-body">
            <div className="info-grid">
              {[
                ['Consumer Name', record.consumerName],
                ['Consumer No', record.consumerNo],
                ['Contact Number', record.contactNumber],
                ['Application Reference No', record.applicationRefNo],
                ['Address', record.address],
                ['Sub-Division', record.subDivision],
              ].map(([label, value]) => (
                <React.Fragment key={label}>
                  <div className="info-label">{label}</div>
                  <div className="info-value">{value || '—'}</div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* ── Installation Details ───────────────────────────────────────────── */}
        <div className="drt-card mb-4">
          <div className="drt-card-header"><i className="bi bi-lightning-fill me-2"></i>Installation Details</div>
          <div className="drt-card-body">
            <div className="info-grid">
              {[
                ['Plant Capacity', record.plantCapacity],
                ['Vendor Name', record.vendorName],
                ['Installation Date', formatDate(record.installationDate)],
                ['Date of System Commissioning', record.commissioningDate ? formatDate(record.commissioningDate) : '—'],
              ].map(([label, value]) => (
                <React.Fragment key={label}>
                  <div className="info-label">{label}</div>
                  <div className="info-value">{value || '—'}</div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* ── Metadata ──────────────────────────────────────────────────────── */}
        <div className="drt-card mb-4">
          <div className="drt-card-header"><i className="bi bi-clock-history me-2"></i>Record Metadata</div>
          <div className="drt-card-body">
            <div className="info-grid">
              <div className="info-label">Record ID</div>
              <div className="info-value"><code style={{ fontSize: '0.8rem' }}>{record._id}</code></div>
              <div className="info-label">Created At</div>
              <div className="info-value">{new Date(record.createdAt).toLocaleString('en-IN')}</div>
              <div className="info-label">Last Updated</div>
              <div className="info-value">{new Date(record.updatedAt).toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>

        {/* ── Photos ────────────────────────────────────────────────────────── */}
        <div className="drt-card">
          <div className="drt-card-header"><i className="bi bi-camera-fill me-2"></i>Installation Photographs</div>
          <div className="drt-card-body">
            <div className="row">
              <PhotoCard title="Inverter Photo" photo={record.inverterPhoto} />
              <PhotoCard title="Panel Photo" photo={record.panelPhoto} />
              <PhotoCard title="Earth Photo" photo={record.earthPhoto} />
              <PhotoCard title="LA Photo" photo={record.laPhoto} />
              <PhotoCard title="Additional Photo" photo={record.additionalPhoto} />
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
