// Data models for the TalentFlow application

export const JobStatus = {
  ACTIVE: 'active',
  ARCHIVED: 'archived'
};

export const CandidateStage = {
  APPLIED: 'applied',
  SCREEN: 'screen',
  TECH: 'tech',
  OFFER: 'offer',
  HIRED: 'hired',
  REJECTED: 'rejected'
};

export const QuestionType = {
  SINGLE_CHOICE: 'single-choice',
  MULTI_CHOICE: 'multi-choice',
  SHORT_TEXT: 'short-text',
  LONG_TEXT: 'long-text',
  NUMERIC: 'numeric',
  FILE_UPLOAD: 'file-upload'
};

// Job interface
export const createJob = ({
  id,
  title,
  slug,
  status = JobStatus.ACTIVE,
  description = '',
  requirements = [],
  tags = [],
  order = 0,
  createdAt = new Date(),
  updatedAt = new Date()
}) => ({
  id,
  title,
  slug,
  status,
  description,
  requirements,
  tags,
  order,
  createdAt,
  updatedAt
});

// Candidate interface
export const createCandidate = ({
  id,
  name,
  email,
  stage = CandidateStage.APPLIED,
  jobId,
  appliedAt = new Date(),
  updatedAt = new Date(),
  notes = [],
  timeline = []
}) => ({
  id,
  name,
  email,
  stage,
  jobId,
  appliedAt,
  updatedAt,
  notes,
  timeline
});

// Note interface
export const createNote = ({
  id,
  content,
  author,
  createdAt = new Date(),
  mentions = []
}) => ({
  id,
  content,
  author,
  createdAt,
  mentions
});

// Timeline entry interface
export const createTimelineEntry = ({
  id,
  type,
  description,
  timestamp = new Date(),
  metadata = {}
}) => ({
  id,
  type,
  description,
  timestamp,
  metadata
});

// Assessment question interface
export const createQuestion = ({
  id,
  type,
  question,
  options = [],
  required = false,
  validation = {},
  conditionalLogic = null
}) => ({
  id,
  type,
  question,
  options,
  required,
  validation,
  conditionalLogic
});

// Assessment interface
export const createAssessment = ({
  id,
  jobId,
  title,
  description = '',
  questions = [],
  createdAt = new Date(),
  updatedAt = new Date()
}) => ({
  id,
  jobId,
  title,
  description,
  questions,
  createdAt,
  updatedAt
});

// Assessment response interface
export const createAssessmentResponse = ({
  id,
  assessmentId,
  candidateId,
  responses = {},
  submittedAt = new Date(),
  score = null
}) => ({
  id,
  assessmentId,
  candidateId,
  responses,
  submittedAt,
  score
});
