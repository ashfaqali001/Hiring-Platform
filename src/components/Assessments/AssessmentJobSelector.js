import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AssessmentJobSelector.css';

const AssessmentJobSelector = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/jobs');
      if (!response.ok) throw new Error('Failed to fetch jobs');
      
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJobSelect = (jobId) => {
    navigate(`/jobs/${jobId}/assessments/new/builder`);
  };

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="assessment-job-selector">
        <div className="loading">Loading jobs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="assessment-job-selector">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="assessment-job-selector">
      <div className="selector-header">
        <h1>Select Job for Assessment</h1>
        <p>Choose a job to create or edit assessments for</p>
      </div>

      <div className="search-section">
        <input
          type="text"
          placeholder="Search jobs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="jobs-grid">
        {filteredJobs.length === 0 ? (
          <div className="no-jobs">
            <p>No jobs found. Create a job first to add assessments.</p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/jobs')}
            >
              Go to Jobs
            </button>
          </div>
        ) : (
          filteredJobs.map(job => (
            <div 
              key={job.id} 
              className="job-card"
              onClick={() => handleJobSelect(job.id)}
            >
              <div className="job-header">
                <h3 className="job-title">{job.title}</h3>
                <span className={`status-badge ${job.status}`}>
                  {job.status}
                </span>
              </div>
              <p className="job-description">{job.description}</p>
              <div className="job-meta">
                <span className="job-location">{job.location}</span>
                <span className="job-type">{job.type}</span>
              </div>
              <div className="job-actions">
                <button className="btn btn-primary">
                  Create Assessment
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AssessmentJobSelector;
