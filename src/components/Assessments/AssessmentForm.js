import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { QuestionType } from '../../types/index';
import './AssessmentForm.css';

const AssessmentForm = () => {
  const { jobId, assessmentId } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const loadAssessment = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Loading assessment:', { jobId, assessmentId });
      const response = await fetch(`/api/assessments/${jobId}/${assessmentId}`);
      console.log('Assessment response:', response.status, response.ok);
      if (response.ok) {
        const data = await response.json();
        setAssessment(data);
        // Initialize responses object
        const initialResponses = {};
        data.questions.forEach(question => {
          if (question.type === QuestionType.MULTI_CHOICE) {
            initialResponses[question.id] = [];
          } else {
            initialResponses[question.id] = '';
          }
        });
        setResponses(initialResponses);
      } else {
        if (response.status === 404) {
          setError('Assessment not found. It may have been deleted or the link is incorrect.');
        } else {
          setError(`Failed to load assessment (${response.status})`);
        }
      }
    } catch (err) {
      console.error('Load assessment error:', err);
      setError('Failed to load assessment. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [jobId, assessmentId]);

  useEffect(() => {
    loadAssessment();
  }, [assessmentId, jobId, loadAssessment]);

  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // Clear validation error for this question
    if (validationErrors[questionId]) {
      setValidationErrors(prev => ({
        ...prev,
        [questionId]: null
      }));
    }
  };

  const handleMultiChoiceChange = (questionId, option, checked) => {
    setResponses(prev => {
      const currentValues = prev[questionId] || [];
      if (checked) {
        return {
          ...prev,
          [questionId]: [...currentValues, option]
        };
      } else {
        return {
          ...prev,
          [questionId]: currentValues.filter(v => v !== option)
        };
      }
    });
  };

  const validateResponses = () => {
    const errors = {};
    
    assessment.questions.forEach(question => {
      const response = responses[question.id];
      
      if (question.required) {
        if (!response || (Array.isArray(response) && response.length === 0)) {
          errors[question.id] = 'This question is required';
        }
      }
      
      // Basic validation only
      if (response && question.validation) {
        if (question.validation.pattern && !new RegExp(question.validation.pattern).test(response)) {
          errors[question.id] = 'Invalid format';
        }
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateResponses()) {
      setError('Please fix the validation errors');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/assessments/${jobId}/${assessmentId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          responses,
          submittedAt: new Date()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit assessment');
      }

      // Show success message and redirect
      alert('Assessment submitted successfully!');
      navigate(`/jobs/${jobId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question, index) => {
    const response = responses[question.id] || '';
    const hasError = validationErrors[question.id];

    return (
      <div key={question.id} className={`question-item ${hasError ? 'error' : ''}`}>
        <div className="question-header">
          <h3>Question {index + 1}</h3>
          {question.required && <span className="required-badge">Required</span>}
        </div>
        
        <div className="question-text">
          <p>{question.question}</p>
        </div>

        <div className="question-input">
          {question.type === QuestionType.SINGLE_CHOICE && (
            <div className="radio-group">
              {question.options.map((option, optionIndex) => (
                <label key={optionIndex} className="radio-option">
                  <input
                    type="radio"
                    name={`question_${question.id}`}
                    value={option}
                    checked={response === option}
                    onChange={(e) => handleResponseChange(question.id, e.target.value)}
                  />
                  <span className="radio-label">{option}</span>
                </label>
              ))}
            </div>
          )}

          {question.type === QuestionType.MULTI_CHOICE && (
            <div className="checkbox-group">
              {question.options.map((option, optionIndex) => (
                <label key={optionIndex} className="checkbox-option">
                  <input
                    type="checkbox"
                    value={option}
                    checked={response.includes(option)}
                    onChange={(e) => handleMultiChoiceChange(question.id, option, e.target.checked)}
                  />
                  <span className="checkbox-label">{option}</span>
                </label>
              ))}
            </div>
          )}

          {question.type === QuestionType.SHORT_TEXT && (
            <input
              type="text"
              value={response}
              onChange={(e) => handleResponseChange(question.id, e.target.value)}
              placeholder="Enter your answer..."
              className="form-input"
            />
          )}

          {question.type === QuestionType.LONG_TEXT && (
            <textarea
              value={response}
              onChange={(e) => handleResponseChange(question.id, e.target.value)}
              placeholder="Enter your answer..."
              rows={4}
              className="form-textarea"
            />
          )}

          {question.type === QuestionType.NUMERIC && (
            <input
              type="number"
              value={response}
              onChange={(e) => handleResponseChange(question.id, e.target.value)}
              placeholder="Enter a number..."
              className="form-input"
            />
          )}

          {question.type === QuestionType.FILE_UPLOAD && (
            <div className="file-upload-group">
              <input
                type="file"
                onChange={(e) => handleResponseChange(question.id, e.target.files[0]?.name || '')}
                className="file-input"
              />
              <p className="file-upload-note">📎 File upload (stub - not functional)</p>
            </div>
          )}
        </div>

        {hasError && (
          <div className="error-message">
            {validationErrors[question.id]}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="assessment-form">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="assessment-form">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h2>Error Loading Assessment</h2>
          <p>{error}</p>
          <Link to={`/jobs/${jobId}`} className="btn btn-primary">
            Back to Job
          </Link>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="assessment-form">
        <div className="error-state">
          <div className="error-icon">📝</div>
          <h2>Assessment Not Found</h2>
          <p>The assessment you're looking for doesn't exist.</p>
          <Link to={`/jobs/${jobId}`} className="btn btn-primary">
            Back to Job
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="assessment-form">
      <div className="breadcrumb">
        <Link to="/jobs">Jobs</Link>
        <span>›</span>
        <Link to={`/jobs/${jobId}`}>Job #{jobId}</Link>
        <span>›</span>
        <span>Assessment Form</span>
      </div>
      
      <div className="form-header">
        <h1>{assessment.title}</h1>
        {assessment.description && (
          <p className="form-description">{assessment.description}</p>
        )}
        <div className="form-meta">
          <span>{assessment.questions.length} questions</span>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          {error}
          <button className="error-close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="assessment-form-content">
        <div className="questions-container">
          {assessment.questions.map((question, index) => renderQuestion(question, index))}
        </div>

        <div className="form-actions">
          <Link to={`/jobs/${jobId}`} className="btn btn-secondary">
            Cancel
          </Link>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Assessment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AssessmentForm;
