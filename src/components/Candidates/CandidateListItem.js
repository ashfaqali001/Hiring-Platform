import React from 'react';
import { Link } from 'react-router-dom';

const CandidateListItem = ({ candidate, formatDate }) => {
  if (!candidate) {
    return (
      <div className="candidate-list-item loading">
        <div className="candidate-skeleton">
          <div className="skeleton-avatar"></div>
          <div className="skeleton-content">
            <div className="skeleton-line skeleton-name"></div>
            <div className="skeleton-line skeleton-email"></div>
          </div>
        </div>
      </div>
    );
  }

  const getStageColor = (stage) => {
    const colors = {
      applied: '#3182ce',
      screen: '#d53f8c',
      tech: '#dd6b20',
      offer: '#38a169',
      hired: '#319795',
      rejected: '#e53e3e'
    };
    return colors[stage] || '#718096';
  };

  return (
    <div className="candidate-list-item">
      <div className="candidate-avatar">
        <div 
          className="avatar-circle"
          style={{ backgroundColor: getStageColor(candidate.stage) }}
        >
          {candidate.name.charAt(0).toUpperCase()}
        </div>
      </div>
      
      <div className="candidate-info">
        <Link to={`/candidates/${candidate.id}`} className="candidate-name">
          {candidate.name}
        </Link>
        <span className="candidate-email">{candidate.email}</span>
      </div>
      
      <div className="candidate-stage">
        <span 
          className="stage-badge"
          style={{ 
            backgroundColor: `${getStageColor(candidate.stage)}20`,
            color: getStageColor(candidate.stage)
          }}
        >
          {candidate.stage}
        </span>
      </div>
      
      <div className="candidate-job">
        <span className="job-title">Job #{candidate.jobId}</span>
      </div>
      
      <div className="candidate-date">
        <span className="date-label">Applied</span>
        <span className="date-value">{formatDate(candidate.appliedAt)}</span>
      </div>
      
      <div className="candidate-actions">
        <Link 
          to={`/candidates/${candidate.id}`} 
          className="btn btn-sm btn-secondary"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
};

export default CandidateListItem;
