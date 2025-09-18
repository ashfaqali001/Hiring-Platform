import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const CandidateProfile = () => {
  const { candidateId } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        const response = await fetch(`/api/candidates/${candidateId}`);
        if (!response.ok) throw new Error('Candidate not found');
        const data = await response.json();
        setCandidate(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidate();
  }, [candidateId]);

  if (loading) {
    return (
      <div className="candidate-profile">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading candidate profile...</p>
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="candidate-profile">
        <div className="error-state">
          <h2>Candidate Not Found</h2>
          <p>{error || 'The candidate you\'re looking for doesn\'t exist.'}</p>
          <Link to="/candidates" className="btn btn-primary">
            Back to Candidates
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="candidate-profile">
      <div className="breadcrumb">
        <Link to="/candidates">Candidates</Link>
        <span>›</span>
        <span>{candidate.name}</span>
      </div>
      
      <div className="profile-header">
        <div className="candidate-avatar-large">
          <div className="avatar-circle-large">
            {candidate.name.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="candidate-details">
          <h1>{candidate.name}</h1>
          <p>{candidate.email}</p>
          <div className="stage-badge-large">
            {candidate.stage}
          </div>
        </div>
      </div>
      
      <div className="profile-content">
        <p>Candidate profile details coming soon...</p>
        <p>Applied for Job #{candidate.jobId}</p>
        <p>Applied on: {new Date(candidate.appliedAt).toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default CandidateProfile;
