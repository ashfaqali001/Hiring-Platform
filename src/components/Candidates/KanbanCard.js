import React from 'react';
import { Link } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const KanbanCard = ({ candidate, formatDate, stageColor }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: candidate.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-card ${isDragging ? 'dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="kanban-card-header">
        <div className="candidate-avatar-small">
          <div 
            className="avatar-circle-small"
            style={{ backgroundColor: stageColor }}
          >
            {candidate.name.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="candidate-basic-info">
          <Link to={`/candidates/${candidate.id}`} className="candidate-name-small">
            {candidate.name}
          </Link>
          <span className="candidate-email-small">{candidate.email}</span>
        </div>
      </div>
      
      <div className="kanban-card-content">
        <div className="card-meta">
          <span className="meta-item">
            <span className="meta-label">Job:</span>
            <span className="meta-value">#{candidate.jobId}</span>
          </span>
          <span className="meta-item">
            <span className="meta-label">Applied:</span>
            <span className="meta-value">{formatDate(candidate.appliedAt)}</span>
          </span>
        </div>
        
        {candidate.notes && candidate.notes.length > 0 && (
          <div className="card-notes">
            <span className="notes-indicator">💬 {candidate.notes.length} notes</span>
          </div>
        )}
      </div>
      
      <div className="kanban-card-actions">
        <Link 
          to={`/candidates/${candidate.id}`} 
          className="card-action-btn"
          onClick={(e) => e.stopPropagation()}
        >
          View Profile
        </Link>
      </div>
    </div>
  );
};

export default KanbanCard;
