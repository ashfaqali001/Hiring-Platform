import React from 'react';
import { Link } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableJobCard = ({ job, onEdit, onDelete, onArchive, formatDate, getStatusBadgeClass }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Debug logging to identify data issues
  console.log('Job data:', { id: job.id, title: job.title, status: job.status, tags: job.tags });

  // Don't render if job has placeholder content
  if (!job.title || job.title.includes('AAAA') || job.title.length < 3) {
    return null;
  }

  // Ensure job has all required properties
  const safeJob = {
    id: job.id,
    title: job.title || 'Untitled Job',
    description: job.description || 'No description available',
    status: job.status || 'active',
    tags: job.tags || [],
    createdAt: job.createdAt || new Date(),
    order: job.order || 0
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`job-card ${isDragging ? 'dragging' : ''}`}
    >
      <div className="job-card-header">
        <div className="job-title-section">
          <div className="drag-handle" {...attributes} {...listeners}>
            <span className="drag-icon">⋮⋮</span>
          </div>
          <div className="job-title-content">
            <Link 
              to={`/jobs/${safeJob.id}`} 
              className="job-title"
            >
              {safeJob.title}
            </Link>
            <div className={getStatusBadgeClass(safeJob.status)}>
              {safeJob.status === 'active' ? 'Active' : 'Archived'}
            </div>
          </div>
        </div>
        <div className="job-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onEdit(job)}
          >
            Edit
          </button>
          <button
            className={`btn btn-sm ${safeJob.status === 'active' ? 'btn-warning' : 'btn-success'}`}
            onClick={() => onArchive(safeJob.id, safeJob.status === 'active' ? 'archived' : 'active')}
          >
            {safeJob.status === 'active' ? 'Archive' : 'Unarchive'}
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => onDelete(safeJob.id)}
          >
            Delete
          </button>
        </div>
      </div>

      <div className="job-card-content">
        <p className="job-description">{safeJob.description}</p>
        
        {safeJob.tags && safeJob.tags.length > 0 && (
          <div className="job-tags">
            {safeJob.tags.map((tag, index) => (
              <span key={index} className="job-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="job-meta">
          <span className="job-date">
            Created: {formatDate(safeJob.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SortableJobCard;