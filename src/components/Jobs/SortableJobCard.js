import React from 'react';
import { Link } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableJobCard = ({ job, onEdit, onDelete, formatDate, getStatusBadgeClass }) => {
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
            <Link to={`/jobs/${job.id}`} className="job-title">
              {job.title}
            </Link>
            <div className={getStatusBadgeClass(job.status)}>
              {job.status}
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
            className="btn btn-danger btn-sm"
            onClick={() => onDelete(job.id)}
          >
            Delete
          </button>
        </div>
      </div>

      <div className="job-card-content">
        <p className="job-description">{job.description}</p>
        
        {job.tags && job.tags.length > 0 && (
          <div className="job-tags">
            {job.tags.map((tag, index) => (
              <span key={index} className="job-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="job-meta">
          <span className="job-date">
            Created: {formatDate(job.createdAt)}
          </span>
          <span className="job-order">
            Order: #{job.order + 1}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SortableJobCard;
