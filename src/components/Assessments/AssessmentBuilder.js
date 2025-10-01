import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { QuestionType } from '../../types/index';
import './AssessmentBuilder.css';

const AssessmentBuilder = () => {
  const { jobId, assessmentId } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState({
    title: '',
    description: '',
    questions: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [previewResponses, setPreviewResponses] = useState({});
  const [saveAttempted, setSaveAttempted] = useState(false);

  // Load existing assessment if editing
  useEffect(() => {
    if (assessmentId && assessmentId !== 'new') {
      loadAssessment();
    }
  }, [assessmentId, jobId]);

  const loadAssessment = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/assessments/${jobId}/${assessmentId}`);
      if (response.ok) {
        const data = await response.json();
        setAssessment(data);
      }
    } catch (err) {
      setError('Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = (type) => {
    const newQuestion = {
      id: Date.now(),
      type,
      question: '',
      options: type === QuestionType.SINGLE_CHOICE || type === QuestionType.MULTI_CHOICE ? ['', ''] : [],
      required: false,
      validation: {}
    };
    
    setAssessment(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const updateQuestion = (questionId, updates) => {
    setAssessment(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, ...updates } : q
      )
    }));
  };

  const removeQuestion = (questionId) => {
    setAssessment(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const addOption = (questionId) => {
    updateQuestion(questionId, {
      options: [...assessment.questions.find(q => q.id === questionId).options, '']
    });
  };

  const updateOption = (questionId, optionIndex, value) => {
    const question = assessment.questions.find(q => q.id === questionId);
    const newOptions = [...question.options];
    newOptions[optionIndex] = value;
    updateQuestion(questionId, { options: newOptions });
  };

  const removeOption = (questionId, optionIndex) => {
    const question = assessment.questions.find(q => q.id === questionId);
    const newOptions = question.options.filter((_, index) => index !== optionIndex);
    updateQuestion(questionId, { options: newOptions });
  };

  const handleSave = useCallback(async () => {
    // Prevent multiple saves
    if (loading || saveAttempted) {
      return;
    }
    
    try {
      setLoading(true);
      setSaveAttempted(true);
      setError(null);

      if (!assessment.title.trim()) {
        setError('Assessment title is required');
        setLoading(false);
        setSaveAttempted(false);
        return;
      }

      if (assessment.questions.length === 0) {
        setError('At least one question is required');
        setLoading(false);
        setSaveAttempted(false);
        return;
      }

      const url = assessmentId === 'new' 
        ? `/api/assessments/${jobId}` 
        : `/api/assessments/${jobId}/${assessmentId}`;
      
      const method = assessmentId === 'new' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(assessment)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to save assessment (${response.status})`);
      }

      const result = await response.json();
      console.log('Assessment saved successfully:', result);
      
      // Navigate back to job detail
      navigate(`/jobs/${jobId}`);
    } catch (err) {
      console.error('Save assessment error:', err);
      setError(err.message);
      setSaveAttempted(false);
    } finally {
      setLoading(false);
    }
  }, [loading, saveAttempted, assessment, assessmentId, jobId, navigate]);

  const previewAssessment = () => {
    navigate(`/jobs/${jobId}/assessments/${assessmentId || 'new'}/form`);
  };

  const toggleLivePreview = () => {
    setShowLivePreview(!showLivePreview);
    if (!showLivePreview) {
      setPreviewResponses({});
    }
  };

  const handlePreviewResponseChange = (questionId, value) => {
    setPreviewResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };


  if (loading) {
    return (
      <div className="assessment-builder">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading assessment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="assessment-builder">
      <div className="breadcrumb">
        <Link to="/jobs">Jobs</Link>
        <span>›</span>
        <Link to={`/jobs/${jobId}`}>Job #{jobId}</Link>
        <span>›</span>
        <span>Assessment Builder</span>
      </div>
      
      <div className="builder-header">
        <h1>Assessment Builder</h1>
        <div className="builder-actions">
          <button 
            className="btn btn-secondary" 
            onClick={toggleLivePreview}
            disabled={assessment.questions.length === 0}
          >
            {showLivePreview ? 'Hide Live Preview' : 'Live Preview'}
          </button>
          <button 
            className="btn btn-outline" 
            onClick={previewAssessment}
            disabled={assessment.questions.length === 0}
          >
            Full Preview
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Assessment'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          {error}
          <button className="error-close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="builder-content">
        <div className="assessment-info">
          <div className="form-group">
            <label htmlFor="title">Assessment Title *</label>
            <input
              type="text"
              id="title"
              value={assessment.title}
              onChange={(e) => setAssessment(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Technical Skills Assessment"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={assessment.description}
              onChange={(e) => setAssessment(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this assessment covers..."
              rows={3}
              className="form-textarea"
            />
          </div>
        </div>

        <div className="questions-section">
          <div className="section-header">
            <h2>Questions ({assessment.questions.length})</h2>
             <div className="question-type-buttons">
               <button 
                 className="btn btn-sm btn-secondary"
                 onClick={() => addQuestion(QuestionType.SINGLE_CHOICE)}
               >
                 Single Choice
               </button>
               <button 
                 className="btn btn-sm btn-secondary"
                 onClick={() => addQuestion(QuestionType.MULTI_CHOICE)}
               >
                 Multi Choice
               </button>
               <button 
                 className="btn btn-sm btn-secondary"
                 onClick={() => addQuestion(QuestionType.SHORT_TEXT)}
               >
                 Short Text
               </button>
               <button 
                 className="btn btn-sm btn-secondary"
                 onClick={() => addQuestion(QuestionType.LONG_TEXT)}
               >
                 Long Text
               </button>
               <button 
                 className="btn btn-sm btn-secondary"
                 onClick={() => addQuestion(QuestionType.NUMERIC)}
               >
                 Numeric
               </button>
               <button 
                 className="btn btn-sm btn-secondary"
                 onClick={() => addQuestion(QuestionType.FILE_UPLOAD)}
               >
                 File Upload
               </button>
             </div>
          </div>

          {assessment.questions.length === 0 ? (
            <div className="empty-questions">
              <div className="empty-icon">📝</div>
              <h3>No questions yet</h3>
              <p>Add questions to build your assessment</p>
            </div>
          ) : (
            <div className="questions-list">
              {assessment.questions.map((question, index) => (
                <div key={question.id} className="question-card">
                  <div className="question-header">
                    <span className="question-number">Q{index + 1}</span>
                    <span className="question-type">{question.type}</span>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => removeQuestion(question.id)}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="question-content">
                    <div className="form-group">
                      <label>Question Text *</label>
                      <input
                        type="text"
                        value={question.question}
                        onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                        placeholder="Enter your question..."
                        className="form-input"
                      />
                    </div>

                    {(question.type === QuestionType.SINGLE_CHOICE || question.type === QuestionType.MULTI_CHOICE) && (
                      <div className="options-section">
                        <label>Options</label>
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="option-input">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                              placeholder={`Option ${optionIndex + 1}`}
                              className="form-input"
                            />
                            {question.options.length > 2 && (
                              <button 
                                className="btn btn-danger btn-sm"
                                onClick={() => removeOption(question.id, optionIndex)}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => addOption(question.id)}
                        >
                          Add Option
                        </button>
                      </div>
                    )}

                     <div className="question-settings">
                       <label className="checkbox-label">
                         <input
                           type="checkbox"
                           checked={question.required}
                           onChange={(e) => updateQuestion(question.id, { required: e.target.checked })}
                         />
                         Required question
                       </label>
                     </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Preview Panel */}
        {showLivePreview && (
          <div className="live-preview-panel">
            <div className="preview-header">
              <h3>Live Preview</h3>
              <p>See how your assessment will look to candidates</p>
            </div>
            
            <div className="preview-content">
              <div className="preview-assessment">
                <h2>{assessment.title || 'Untitled Assessment'}</h2>
                <p>{assessment.description || 'No description provided'}</p>
                
                 <div className="preview-questions">
                   {assessment.questions.map((question, index) => (
                     <div key={question.id} className="preview-question">
                       <label className="preview-question-label">
                         Q{index + 1}: {question.question}
                       </label>
                       
                       {question.type === QuestionType.SHORT_TEXT && (
                         <input
                           type="text"
                           value={previewResponses[question.id] || ''}
                           onChange={(e) => handlePreviewResponseChange(question.id, e.target.value)}
                           placeholder="Your answer..."
                           className="form-input"
                         />
                       )}
                       
                       {question.type === QuestionType.LONG_TEXT && (
                         <textarea
                           value={previewResponses[question.id] || ''}
                           onChange={(e) => handlePreviewResponseChange(question.id, e.target.value)}
                           placeholder="Your answer..."
                           rows={4}
                           className="form-textarea"
                         />
                       )}
                       
                       {question.type === QuestionType.NUMERIC && (
                         <input
                           type="number"
                           value={previewResponses[question.id] || ''}
                           onChange={(e) => handlePreviewResponseChange(question.id, e.target.value)}
                           placeholder="Enter a number..."
                           className="form-input"
                         />
                       )}
                       
                       {question.type === QuestionType.SINGLE_CHOICE && (
                         <div className="preview-options">
                           {question.options.map((option, optionIndex) => (
                             <label key={optionIndex} className="preview-option">
                               <input
                                 type="radio"
                                 name={`preview-${question.id}`}
                                 value={option}
                                 checked={previewResponses[question.id] === option}
                                 onChange={(e) => handlePreviewResponseChange(question.id, e.target.value)}
                               />
                               {option}
                             </label>
                           ))}
                         </div>
                       )}
                       
                       {question.type === QuestionType.MULTI_CHOICE && (
                         <div className="preview-options">
                           {question.options.map((option, optionIndex) => (
                             <label key={optionIndex} className="preview-option">
                               <input
                                 type="checkbox"
                                 value={option}
                                 checked={(previewResponses[question.id] || []).includes(option)}
                                 onChange={(e) => {
                                   const current = previewResponses[question.id] || [];
                                   const updated = e.target.checked
                                     ? [...current, option]
                                     : current.filter(o => o !== option);
                                   handlePreviewResponseChange(question.id, updated);
                                 }}
                               />
                               {option}
                             </label>
                           ))}
                         </div>
                       )}
                       
                       {question.type === QuestionType.FILE_UPLOAD && (
                         <div className="preview-file-upload">
                           <input
                             type="file"
                             onChange={(e) => handlePreviewResponseChange(question.id, e.target.files[0]?.name || '')}
                             className="form-input"
                           />
                           <p className="file-upload-note">📎 File upload (stub - not functional)</p>
                         </div>
                       )}
                     </div>
                   ))}
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentBuilder;
