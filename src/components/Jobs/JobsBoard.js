import React, { useState, useEffect, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import SortableJobCard from './SortableJobCard';
import JobModal from './JobModal';
import './JobsBoard.css';

const JobsBoard = () => {
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

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try MSW API first
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          pageSize: pageSize.toString(),
          ...(searchTerm && { search: searchTerm }),
          ...(statusFilter && { status: statusFilter }),
          ...(sortBy && { sort: sortBy })
        });

        const response = await fetch(`/api/jobs?${params}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Response is not JSON. MSW might not be running.');
        }
        
        const data = await response.json();
        
        // Ensure data structure is correct
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid response format');
        }
        
        setFilteredJobs(data.jobs || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setError(null);
        return;
      } catch (apiError) {
        console.warn('MSW API failed, trying direct database access:', apiError.message);
        
        // Fallback to direct database access
        const { dbOperations } = await import('../../database/db');
        let allJobs = await dbOperations.getAllJobs();
        
        // Apply filters
        if (searchTerm) {
          allJobs = allJobs.filter(job => 
            job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (job.tags && job.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
          );
        }
        
        if (statusFilter) {
          allJobs = allJobs.filter(job => job.status === statusFilter);
        }
        
        // Apply sorting
        if (sortBy === 'title') {
          allJobs.sort((a, b) => a.title.localeCompare(b.title));
        } else if (sortBy === 'createdAt') {
          allJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        
        // Apply pagination
        const startIndex = (currentPage - 1) * pageSize;
        const paginatedJobs = allJobs.slice(startIndex, startIndex + pageSize);
        
        setFilteredJobs(paginatedJobs);
        setTotalPages(Math.ceil(allJobs.length / pageSize));
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(`Failed to load jobs: ${err.message}`);
      setFilteredJobs([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, sortBy]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

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
      console.log('Deleting job:', jobId);
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE'
      });
      
      console.log('Delete response:', response.status, response.ok);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete job (${response.status})`);
      }
      
      console.log('Job deleted successfully, refreshing list...');
      await fetchJobs();
    } catch (err) {
      console.error('Delete job error:', err);
      
      // Try direct database access as fallback
      try {
        console.log('Trying direct database deletion...');
        const { db } = await import('../../database/db');
        await db.jobs.delete(parseInt(jobId));
        console.log('Job deleted directly from database');
        await fetchJobs();
      } catch (dbError) {
        console.error('Direct database deletion failed:', dbError);
        setError(err.message);
      }
    }
  };

  const handleArchiveJob = async (jobId, newStatus) => {
    try {
      console.log('Archiving job:', jobId, 'to status:', newStatus);
      
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      console.log('Archive response:', response.status, response.ok);

      if (response.ok) {
        console.log('Job archived successfully, refreshing list...');
        await fetchJobs();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to ${newStatus === 'archived' ? 'archive' : 'unarchive'} job (${response.status})`);
      }
    } catch (err) {
      console.error('Archive job error:', err);
      
      // Try direct database access as fallback
      try {
        console.log('Trying direct database archive...');
        const { db } = await import('../../database/db');
        await db.jobs.update(parseInt(jobId), { 
          status: newStatus, 
          updatedAt: new Date() 
        });
        console.log('Job archived directly in database');
        await fetchJobs();
      } catch (dbError) {
        console.error('Direct database archive failed:', dbError);
        setError(err.message);
      }
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
      
      console.log('Reordering job:', active.id, 'from', oldIndex, 'to', newIndex);
      
      const newJobs = arrayMove(filteredJobs, oldIndex, newIndex);
      setFilteredJobs(newJobs);

      // Optimistic update
      try {
        console.log('Sending reorder request...');
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

        console.log('Reorder response:', response.status, response.ok);

        if (!response.ok) {
          // Rollback on failure
          console.log('Reorder failed, rolling back...');
          setFilteredJobs(filteredJobs);
          throw new Error('Failed to reorder jobs');
        } else {
          console.log('Jobs reordered successfully');
        }
      } catch (err) {
        console.error('Reorder error:', err);
        
        // Try direct database access as fallback
        try {
          console.log('Trying direct database reorder...');
          const { db } = await import('../../database/db');
          
          // Update the order of all jobs
          const updatedJobs = newJobs.map((job, index) => ({
            ...job,
            order: index
          }));
          
          await db.jobs.bulkPut(updatedJobs);
          console.log('Jobs reordered directly in database');
        } catch (dbError) {
          console.error('Direct database reorder failed:', dbError);
          setError(err.message);
          // Refresh to get correct order
          await fetchJobs();
        }
      }
    }
  };

  const getStatusBadgeClass = (status) => {
    return status === 'active' ? 'status-badge active' : 'status-badge archived';
  };

  const formatDate = (date) => {
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
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
          <div className="drag-instruction">
            <span className="drag-icon">⋮⋮</span>
            <span>Drag jobs by the handle to reorder them</span>
          </div>
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
          >
            <SortableContext items={filteredJobs.map(job => job.id)} strategy={rectSortingStrategy}>
              <div className={`jobs-grid ${isReordering ? 'reordering' : ''}`}>
                {filteredJobs.map((job) => (
                  <SortableJobCard
                    key={job.id}
                    job={job}
                    onEdit={handleEditJob}
                    onDelete={handleDeleteJob}
                    onArchive={handleArchiveJob}
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
