import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import SortableJobCard from './SortableJobCard';
import JobModal from './JobModal';
import './JobsBoard.css';

const JobsBoard = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('order');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [isReordering, setIsReordering] = useState(false);

  const pageSize = 10;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(sortBy && { sort: sortBy })
      });

      const response = await fetch(`/api/jobs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch jobs');
      
      const data = await response.json();
      setJobs(data.jobs);
      setFilteredJobs(data.jobs);
      setTotalPages(data.pagination.totalPages);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [currentPage, searchTerm, statusFilter, sortBy]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  const handleCreateJob = () => {
    setEditingJob(null);
    setShowModal(true);
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setShowModal(true);
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete job');
      
      await fetchJobs();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveJob = async (jobData) => {
    try {
      const url = editingJob ? `/api/jobs/${editingJob.id}` : '/api/jobs';
      const method = editingJob ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jobData)
      });
      
      if (!response.ok) throw new Error('Failed to save job');
      
      setShowModal(false);
      setEditingJob(null);
      await fetchJobs();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDragStart = () => {
    setIsReordering(true);
  };

  const handleDragEnd = async (event) => {
    setIsReordering(false);
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = filteredJobs.findIndex(job => job.id === active.id);
      const newIndex = filteredJobs.findIndex(job => job.id === over.id);
      
      const newJobs = arrayMove(filteredJobs, oldIndex, newIndex);
      setFilteredJobs(newJobs);

      // Optimistic update
      try {
        const response = await fetch(`/api/jobs/${active.id}/reorder`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fromOrder: oldIndex,
            toOrder: newIndex
          })
        });

        if (!response.ok) {
          // Rollback on failure
          setFilteredJobs(filteredJobs);
          throw new Error('Failed to reorder jobs');
        }
      } catch (err) {
        setError(err.message);
        // Refresh to get correct order
        await fetchJobs();
      }
    }
  };

  const getStatusBadgeClass = (status) => {
    return status === 'active' ? 'status-badge active' : 'status-badge archived';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="jobs-board">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="jobs-board">
      <div className="jobs-header">
        <div className="header-content">
          <h1>Jobs Board</h1>
          <p className="header-subtitle">Manage your job listings and track applications</p>
        </div>
        <button className="btn btn-primary" onClick={handleCreateJob}>
          <span className="btn-icon">+</span>
          Create Job
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          {error}
          <button className="error-close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="jobs-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search jobs by title or tags..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <div className="filters">
          <select value={statusFilter} onChange={handleStatusFilter} className="filter-select">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
          
          <select value={sortBy} onChange={handleSort} className="filter-select">
            <option value="order">Order</option>
            <option value="title">Title</option>
            <option value="createdAt">Created Date</option>
          </select>
        </div>
      </div>

      <div className="jobs-list">
        {filteredJobs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No jobs found</h3>
            <p>Create your first job to get started</p>
            <button className="btn btn-primary" onClick={handleCreateJob}>
              Create Job
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext items={filteredJobs.map(job => job.id)} strategy={verticalListSortingStrategy}>
              <div className={`jobs-grid ${isReordering ? 'reordering' : ''}`}>
                {filteredJobs.map((job) => (
                  <SortableJobCard
                    key={job.id}
                    job={job}
                    onEdit={handleEditJob}
                    onDelete={handleDeleteJob}
                    formatDate={formatDate}
                    getStatusBadgeClass={getStatusBadgeClass}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          <div className="pagination-info">
            <span>Page {currentPage} of {totalPages}</span>
          </div>
          
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {showModal && (
        <JobModal
          job={editingJob}
          onSave={handleSaveJob}
          onClose={() => {
            setShowModal(false);
            setEditingJob(null);
          }}
        />
      )}
    </div>
  );
};

export default JobsBoard;
