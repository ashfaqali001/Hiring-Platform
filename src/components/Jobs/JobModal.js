import React, { useState, useEffect } from 'react';
import { createJob, JobStatus } from '../../types/index';

const JobModal = ({ job, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: JobStatus.ACTIVE,
    requirements: [''],
    tags: ['']
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || '',
        description: job.description || '',
        status: job.status || JobStatus.ACTIVE,
        requirements: job.requirements?.length ? job.requirements : [''],
        tags: job.tags?.length ? job.tags : ['']
      });
    }
  }, [job]);

  const generateSlug = (title) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    const validRequirements = formData.requirements.filter(req => req.trim());
    if (validRequirements.length === 0) {
      newErrors.requirements = 'At least one requirement is needed';
    }
    
    const validTags = formData.tags.filter(tag => tag.trim());
    if (validTags.length === 0) {
      newErrors.tags = 'At least one tag is needed';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const validRequirements = formData.requirements.filter(req => req.trim());
      const validTags = formData.tags.filter(tag => tag.trim());
      
      const jobData = job ? {
        ...formData,
        requirements: validRequirements,
        tags: validTags,
        slug: generateSlug(formData.title)
      } : createJob({
        ...formData,
        requirements: validRequirements,
        tags: validTags,
        slug: generateSlug(formData.title)
      });
      
      await onSave(jobData);
    } catch (error) {
      setErrors({ submit: 'Failed to save job. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleArrayInputChange = (index, value, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (index, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>{job ? 'Edit Job' : 'Create New Job'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="title">Job Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={errors.title ? 'error' : ''}
              placeholder="e.g., Senior Frontend Developer"
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={errors.description ? 'error' : ''}
              placeholder="Describe the role and responsibilities..."
              rows={4}
            />
            {errors.description && <span className="error-text">{errors.description}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value={JobStatus.ACTIVE}>Active</option>
              <option value={JobStatus.ARCHIVED}>Archived</option>
            </select>
          </div>

          <div className="form-group">
            <label>Requirements *</label>
            {formData.requirements.map((requirement, index) => (
              <div key={index} className="array-input-group">
                <input
                  type="text"
                  value={requirement}
                  onChange={(e) => handleArrayInputChange(index, e.target.value, 'requirements')}
                  placeholder="e.g., 3+ years of React experience"
                />
                {formData.requirements.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => removeArrayItem(index, 'requirements')}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => addArrayItem('requirements')}
            >
              Add Requirement
            </button>
            {errors.requirements && <span className="error-text">{errors.requirements}</span>}
          </div>

          <div className="form-group">
            <label>Tags *</label>
            {formData.tags.map((tag, index) => (
              <div key={index} className="array-input-group">
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => handleArrayInputChange(index, e.target.value, 'tags')}
                  placeholder="e.g., React, JavaScript, Frontend"
                />
                {formData.tags.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => removeArrayItem(index, 'tags')}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => addArrayItem('tags')}
            >
              Add Tag
            </button>
            {errors.tags && <span className="error-text">{errors.tags}</span>}
          </div>

          {errors.submit && (
            <div className="error-banner">
              {errors.submit}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : (job ? 'Update Job' : 'Create Job')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobModal;
