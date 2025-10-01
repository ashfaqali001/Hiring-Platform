import React from 'react';
import { Link } from 'react-router-dom';

const CandidateListItem = ({ candidate, formatDate }) => {
  if (!candidate) {
    return (
      <div className="candidate-item loading">
        <div className="candidate-skeleton">
          <div className="skeleton-line"></div>
          <div className="skeleton-line short"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="candidate-item">
      <div className="candidate-info">
        <div className="candidate-header">
          <h3 className="candidate-name">
            <Link to={`/candidates/${candidate.id}`}>
              {candidate.name}
            </Link>
          </h3>
          <span className={`stage-badge stage-${candidate.stage}`}>
            {candidate.stage}
          </span>
        </div>
        <p className="candidate-email">{candidate.email}</p>
        <div className="candidate-meta">
          <span className="candidate-date">
            Applied: {formatDate(candidate.appliedAt)}
          </span>
          {candidate.jobId && (
            <span className="candidate-job">Job ID: {candidate.jobId}</span>
          )}
        </div>
      </div>
      <div className="candidate-actions">
        <Link 
          to={`/candidates/${candidate.id}`}
          className="btn btn-sm btn-outline"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
};

export default CandidateListItem;