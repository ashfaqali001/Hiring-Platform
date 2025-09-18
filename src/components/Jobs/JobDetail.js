import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './JobDetail.css';

const JobDetail = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch job details
        const jobResponse = await fetch(`/api/jobs/${jobId}`);
        if (!jobResponse.ok) {
          if (jobResponse.status === 404) {
            throw new Error('Job not found');
          }
          throw new Error('Failed to fetch job details');
        }
        const jobData = await jobResponse.json();
        setJob(jobData);
        
        // Fetch candidates for this job
        const candidatesResponse = await fetch(`/api/candidates?jobId=${jobId}`);
        if (candidatesResponse.ok) {
          const candidatesData = await candidatesResponse.json();
          setCandidates(candidatesData.candidates || []);
        }
        
        // Fetch assessments for this job
        const assessmentsResponse = await fetch(`/api/assessments/${jobId}`);
        if (assessmentsResponse.ok) {
          const assessmentsData = await assessmentsResponse.json();
          setAssessments(assessmentsData || []);
        }
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId]);

  const handleArchiveToggle = async () => {
    try {
      const newStatus = job.status === 'active' ? 'archived' : 'active';
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) throw new Error('Failed to update job status');
      
      const updatedJob = await response.json();
      setJob(updatedJob);
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status) => {
    return status === 'active' ? 'status-badge active' : 'status-badge archived';
  };

  const getCandidatesByStage = () => {
    const stages = {
      applied: candidates.filter(c => c.stage === 'applied'),
      screen: candidates.filter(c => c.stage === 'screen'),
      tech: candidates.filter(c => c.stage === 'tech'),
      offer: candidates.filter(c => c.stage === 'offer'),
      hired: candidates.filter(c => c.stage === 'hired'),
      rejected: candidates.filter(c => c.stage === 'rejected')
    };
    return stages;
  };

  if (loading) {
    return (
      <div className="job-detail">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="job-detail">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h2>Error Loading Job</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Try Again
            </button>
            <Link to="/jobs" className="btn btn-secondary">
              Back to Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="job-detail">
        <div className="error-state">
          <div className="error-icon">📋</div>
          <h2>Job Not Found</h2>
          <p>The job you're looking for doesn't exist or has been removed.</p>
          <Link to="/jobs" className="btn btn-primary">
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  const candidatesByStage = getCandidatesByStage();

  return (
    <div className="job-detail">
      <div className="job-detail-header">
        <div className="breadcrumb">
          <Link to="/jobs">Jobs</Link>
          <span className="breadcrumb-separator">›</span>
          <span>{job.title}</span>
        </div>
        
        <div className="job-header-content">
          <div className="job-title-section">
            <h1>{job.title}</h1>
            <div className={getStatusBadgeClass(job.status)}>
              {job.status}
            </div>
          </div>
          
          <div className="job-actions">
            <button
              className={`btn ${job.status === 'active' ? 'btn-secondary' : 'btn-primary'}`}
              onClick={handleArchiveToggle}
            >
              {job.status === 'active' ? 'Archive' : 'Activate'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate(`/jobs`)}
            >
              Edit Job
            </button>
          </div>
        </div>
      </div>

      <div className="job-detail-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'candidates' ? 'active' : ''}`}
          onClick={() => setActiveTab('candidates')}
        >
          Candidates ({candidates.length})
        </button>
        <button
          className={`tab ${activeTab === 'assessments' ? 'active' : ''}`}
          onClick={() => setActiveTab('assessments')}
        >
          Assessments ({assessments.length})
        </button>
      </div>

      <div className="job-detail-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="overview-grid">
              <div className="overview-section">
                <h3>Job Description</h3>
                <p>{job.description}</p>
              </div>
              
              <div className="overview-section">
                <h3>Requirements</h3>
                <ul>
                  {job.requirements?.map((requirement, index) => (
                    <li key={index}>{requirement}</li>
                  ))}
                </ul>
              </div>
              
              <div className="overview-section">
                <h3>Tags</h3>
                <div className="job-tags">
                  {job.tags?.map((tag, index) => (
                    <span key={index} className="job-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="overview-section">
                <h3>Job Information</h3>
                <div className="job-info-grid">
                  <div className="info-item">
                    <span className="info-label">Created:</span>
                    <span className="info-value">{formatDate(job.createdAt)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Last Updated:</span>
                    <span className="info-value">{formatDate(job.updatedAt)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Job Slug:</span>
                    <span className="info-value">{job.slug}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Order:</span>
                    <span className="info-value">#{job.order + 1}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'candidates' && (
          <div className="candidates-tab">
            <div className="candidates-summary">
              <div className="summary-grid">
                <div className="summary-card">
                  <div className="summary-number">{candidatesByStage.applied.length}</div>
                  <div className="summary-label">Applied</div>
                </div>
                <div className="summary-card">
                  <div className="summary-number">{candidatesByStage.screen.length}</div>
                  <div className="summary-label">Screening</div>
                </div>
                <div className="summary-card">
                  <div className="summary-number">{candidatesByStage.tech.length}</div>
                  <div className="summary-label">Technical</div>
                </div>
                <div className="summary-card">
                  <div className="summary-number">{candidatesByStage.offer.length}</div>
                  <div className="summary-label">Offer</div>
                </div>
                <div className="summary-card">
                  <div className="summary-number">{candidatesByStage.hired.length}</div>
                  <div className="summary-label">Hired</div>
                </div>
                <div className="summary-card rejected">
                  <div className="summary-number">{candidatesByStage.rejected.length}</div>
                  <div className="summary-label">Rejected</div>
                </div>
              </div>
            </div>
            
            {candidates.length > 0 ? (
              <div className="candidates-list">
                <h3>Recent Candidates</h3>
                {candidates.slice(0, 10).map(candidate => (
                  <div key={candidate.id} className="candidate-card">
                    <div className="candidate-info">
                      <Link to={`/candidates/${candidate.id}`} className="candidate-name">
                        {candidate.name}
                      </Link>
                      <span className="candidate-email">{candidate.email}</span>
                    </div>
                    <div className="candidate-stage">
                      <span className={`stage-badge ${candidate.stage}`}>
                        {candidate.stage}
                      </span>
                    </div>
                    <div className="candidate-date">
                      {formatDate(candidate.appliedAt)}
                    </div>
                  </div>
                ))}
                {candidates.length > 10 && (
                  <Link to="/candidates" className="btn btn-secondary">
                    View All Candidates
                  </Link>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>No candidates yet</h3>
                <p>Candidates who apply for this job will appear here.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'assessments' && (
          <div className="assessments-tab">
            {assessments.length > 0 ? (
              <div className="assessments-list">
                {assessments.map(assessment => (
                  <div key={assessment.id} className="assessment-card">
                    <div className="assessment-header">
                      <h3>{assessment.title}</h3>
                      <div className="assessment-actions">
                        <Link
                          to={`/jobs/${jobId}/assessments/${assessment.id}/builder`}
                          className="btn btn-secondary btn-sm"
                        >
                          Edit
                        </Link>
                        <Link
                          to={`/jobs/${jobId}/assessments/${assessment.id}/form`}
                          className="btn btn-primary btn-sm"
                        >
                          Preview
                        </Link>
                      </div>
                    </div>
                    <p className="assessment-description">{assessment.description}</p>
                    <div className="assessment-meta">
                      <span>{assessment.questions?.length || 0} questions</span>
                      <span>Created {formatDate(assessment.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h3>No assessments created</h3>
                <p>Create assessments to evaluate candidates for this position.</p>
                <Link
                  to={`/jobs/${jobId}/assessments/new/builder`}
                  className="btn btn-primary"
                >
                  Create Assessment
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetail;
