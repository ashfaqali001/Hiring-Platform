import React from 'react';
import { useParams, Link } from 'react-router-dom';

const AssessmentBuilder = () => {
  const { jobId, assessmentId } = useParams();

  return (
    <div className="assessment-builder">
      <div className="breadcrumb">
        <Link to="/jobs">Jobs</Link>
        <span>›</span>
        <Link to={`/jobs/${jobId}`}>Job #{jobId}</Link>
        <span>›</span>
        <span>Assessment Builder</span>
      </div>
      
      <h1>Assessment Builder</h1>
      <p>Assessment builder coming soon...</p>
      <p>Job ID: {jobId}</p>
      <p>Assessment ID: {assessmentId}</p>
    </div>
  );
};

export default AssessmentBuilder;
