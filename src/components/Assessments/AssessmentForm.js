import React from 'react';
import { useParams, Link } from 'react-router-dom';

const AssessmentForm = () => {
  const { jobId, assessmentId } = useParams();

  return (
    <div className="assessment-form">
      <div className="breadcrumb">
        <Link to="/jobs">Jobs</Link>
        <span>›</span>
        <Link to={`/jobs/${jobId}`}>Job #{jobId}</Link>
        <span>›</span>
        <span>Assessment Form</span>
      </div>
      
      <h1>Assessment Form</h1>
      <p>Assessment form coming soon...</p>
      <p>Job ID: {jobId}</p>
      <p>Assessment ID: {assessmentId}</p>
    </div>
  );
};

export default AssessmentForm;
