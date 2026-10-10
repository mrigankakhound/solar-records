import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({ totalRecords: 0, totalCapacityKW: 0 });
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchRecords = useCallback(async (page = 1, searchTerm = search) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/records', {
        params: { page, limit: pagination.limit, search: searchTerm },
      });
      if (res.data.success) {
        setRecords(res.data.data);
        setPagination(res.data.pagination);
        setStats(res.data.stats);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load records.');
    } finally {
      setLoading(false);
    }
  }, [search, pagination.limit]);

  useEffect(() => {
    fetchRecords(1, '');
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    fetchRecords(1, searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    fetchRecords(1, '');
  };

  const handlePageChange = (newPage) => {
    fetchRecords(newPage, search);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete record for "${name}"?\n\nThis will permanently remove the record and all associated photographs. This action cannot be undone.`)) return;

    setDeletingId(id);
    try {
      await api.delete(`/api/records/${id}`);
      fetchRecords(pagination.page, search);
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadPDF = async (id, name) => {
    setDownloadingId(id);
    try {
      const res = await api.get(`/api/records/${id}/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
      a.download = `DRT_Solar_${safeName}_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('PDF generation failed. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const recentRecords = [...records].slice(0, 3);

  return (
    <>
      <Navbar adminMode={true} />

      <div className="page-header">
        <div className="container">
          <h1><i className="bi bi-speedometer2 me-2"></i>Admin Dashboard</h1>
          <p>Manage DRT Enterprise solar installation records</p>
        </div>
      </div>

      <div className="container pb-5">

        {/* ── Stats ─────────────────────────────────────────────────────────── */}
        <div className="row g-3 mb-4">
          <div className="col-sm-6 col-lg-4">
            <div className="stat-card">
              <div className="stat-icon blue"><i className="bi bi-people-fill"></i></div>
              <div>
                <div className="stat-label">Total Consumers</div>
                <div className="stat-value">{stats.totalRecords}</div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-lg-4">
            <div className="stat-card">
              <div className="stat-icon green"><i className="bi bi-lightning-charge-fill"></i></div>
              <div>
                <div className="stat-label">Total Installed Capacity</div>
                <div className="stat-value">{stats.totalCapacityKW} <span style={{ fontSize: '1rem', fontWeight: 400 }}>KW</span></div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-lg-4">
            <div className="stat-card">
              <div className="stat-icon amber"><i className="bi bi-clock-history"></i></div>
              <div>
                <div className="stat-label">Showing Records</div>
                <div className="stat-value">{pagination.total}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Records Table ─────────────────────────────────────────────────── */}
        <div className="drt-card">
          <div className="drt-card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
            <span><i className="bi bi-table me-2"></i>Consumer Records</span>
          </div>
          <div className="drt-card-body">

            {/* Search */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="row g-2">
                <div className="col">
                  <div className="search-wrapper">
                    <i className="bi bi-search"></i>
                    <input
                      type="text"
                      id="search-input"
                      className="form-control"
                      placeholder="Search by name, consumer no, contact, or reference no..."
                      value={searchInput}
                      onChange={e => setSearchInput(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-auto">
                  <button type="submit" className="btn btn-primary px-3" id="search-btn">
                    <i className="bi bi-search"></i>
                  </button>
                </div>
                {search && (
                  <div className="col-auto">
                    <button type="button" className="btn btn-outline-secondary" onClick={handleClearSearch}>
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                )}
              </div>
              {search && (
                <small className="text-muted mt-1 d-block">
                  Showing results for "<strong>{search}</strong>" — {pagination.total} record(s) found
                </small>
              )}
            </form>

            {/* Error */}
            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-triangle-fill"></i>{error}
              </div>
            )}

            {/* Table */}
            {loading ? (
              <div className="loading-overlay">
                <div className="spinner-border text-primary"></div>
                <p className="mt-3 text-muted">Loading records...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-inbox display-4 d-block mb-3" style={{ color: 'var(--border)' }}></i>
                <h5>No records found</h5>
                <p>{search ? 'Try a different search term.' : 'No consumer records have been submitted yet.'}</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="drt-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Consumer Name</th>
                      <th>Consumer No</th>
                      <th>Contact</th>
                      <th>Capacity</th>
                      <th>Install Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((rec, idx) => (
                      <tr key={rec._id}>
                        <td className="text-muted" style={{ fontSize: '0.8rem' }}>
                          {(pagination.page - 1) * pagination.limit + idx + 1}
                        </td>
                        <td className="fw-semibold">{rec.consumerName}</td>
                        <td><code style={{ fontSize: '0.8rem' }}>{rec.consumerNo}</code></td>
                        <td>{rec.contactNumber}</td>
                        <td><span className="capacity-badge">{rec.plantCapacity}</span></td>
                        <td style={{ fontSize: '0.85rem' }}>{formatDate(rec.installationDate)}</td>
                        <td>
                          <div className="d-flex gap-1">
                            <button
                              className="action-btn view"
                              title="View Record"
                              onClick={() => navigate(`/admin/records/${rec._id}`)}
                              id={`view-${rec._id}`}
                            ><i className="bi bi-eye"></i></button>

                            <button
                              className="action-btn edit"
                              title="Edit Record"
                              onClick={() => navigate(`/admin/records/${rec._id}/edit`)}
                              id={`edit-${rec._id}`}
                            ><i className="bi bi-pencil"></i></button>

                            <button
                              className="action-btn pdf"
                              title="Download PDF"
                              disabled={downloadingId === rec._id}
                              onClick={() => handleDownloadPDF(rec._id, rec.consumerName)}
                              id={`pdf-${rec._id}`}
                            >
                              {downloadingId === rec._id
                                ? <span className="spinner-border spinner-border-sm"></span>
                                : <i className="bi bi-file-earmark-pdf"></i>}
                            </button>

                            <button
                              className="action-btn delete"
                              title="Delete Record"
                              disabled={deletingId === rec._id}
                              onClick={() => handleDelete(rec._id, rec.consumerName)}
                              id={`delete-${rec._id}`}
                            >
                              {deletingId === rec._id
                                ? <span className="spinner-border spinner-border-sm"></span>
                                : <i className="bi bi-trash"></i>}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <nav className="mt-4" aria-label="Records pagination">
                <ul className="pagination drt-pagination justify-content-center mb-0">
                  <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => handlePageChange(pagination.page - 1)}>
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  </li>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                    <li key={p} className={`page-item ${p === pagination.page ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => handlePageChange(p)}>{p}</button>
                    </li>
                  ))}
                  <li className={`page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => handlePageChange(pagination.page + 1)}>
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
                <p className="text-center text-muted mt-2" style={{ fontSize: '0.8rem' }}>
                  Page {pagination.page} of {pagination.totalPages} — {pagination.total} total records
                </p>
              </nav>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
