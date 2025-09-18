import Dexie from 'dexie';

// Define the database
export class TalentFlowDB extends Dexie {
  constructor() {
    super('TalentFlowDB');
    
    this.version(1).stores({
      jobs: '++id, title, slug, status, order, createdAt',
      candidates: '++id, name, email, stage, jobId, appliedAt',
      assessments: '++id, jobId, title, createdAt',
      assessmentResponses: '++id, assessmentId, candidateId, submittedAt'
    });
  }
}

// Create database instance
export const db = new TalentFlowDB();

// Database operations
export const dbOperations = {
  // Jobs
  async getAllJobs() {
    return await db.jobs.orderBy('order').toArray();
  },

  async getJobById(id) {
    return await db.jobs.get(id);
  },

  async getJobBySlug(slug) {
    return await db.jobs.where('slug').equals(slug).first();
  },

  async createJob(job) {
    return await db.jobs.add(job);
  },

  async updateJob(id, updates) {
    return await db.jobs.update(id, { ...updates, updatedAt: new Date() });
  },

  async deleteJob(id) {
    return await db.jobs.delete(id);
  },

  async reorderJobs(jobs) {
    return await db.transaction('rw', db.jobs, async () => {
      for (const job of jobs) {
        await db.jobs.update(job.id, { order: job.order });
      }
    });
  },

  // Candidates
  async getAllCandidates() {
    return await db.candidates.toArray();
  },

  async getCandidatesByJob(jobId) {
    return await db.candidates.where('jobId').equals(jobId).toArray();
  },

  async getCandidateById(id) {
    return await db.candidates.get(id);
  },

  async createCandidate(candidate) {
    return await db.candidates.add(candidate);
  },

  async updateCandidate(id, updates) {
    return await db.candidates.update(id, { ...updates, updatedAt: new Date() });
  },

  async updateCandidateStage(id, stage) {
    const candidate = await db.candidates.get(id);
    if (candidate) {
      const timelineEntry = {
        id: Date.now(),
        type: 'stage_change',
        description: `Moved to ${stage}`,
        timestamp: new Date(),
        metadata: { fromStage: candidate.stage, toStage: stage }
      };
      
      return await db.candidates.update(id, {
        stage,
        timeline: [...(candidate.timeline || []), timelineEntry],
        updatedAt: new Date()
      });
    }
  },

  async addCandidateNote(candidateId, note) {
    const candidate = await db.candidates.get(candidateId);
    if (candidate) {
      return await db.candidates.update(candidateId, {
        notes: [...(candidate.notes || []), note],
        updatedAt: new Date()
      });
    }
  },

  // Assessments
  async getAssessmentsByJob(jobId) {
    return await db.assessments.where('jobId').equals(jobId).toArray();
  },

  async getAssessmentById(id) {
    return await db.assessments.get(id);
  },

  async createAssessment(assessment) {
    return await db.assessments.add(assessment);
  },

  async updateAssessment(id, updates) {
    return await db.assessments.update(id, { ...updates, updatedAt: new Date() });
  },

  // Assessment Responses
  async getResponsesByAssessment(assessmentId) {
    return await db.assessmentResponses.where('assessmentId').equals(assessmentId).toArray();
  },

  async getResponseByCandidate(assessmentId, candidateId) {
    return await db.assessmentResponses
      .where(['assessmentId', 'candidateId'])
      .equals([assessmentId, candidateId])
      .first();
  },

  async saveAssessmentResponse(response) {
    const existing = await this.getResponseByCandidate(response.assessmentId, response.candidateId);
    if (existing) {
      return await db.assessmentResponses.update(existing.id, response);
    } else {
      return await db.assessmentResponses.add(response);
    }
  }
};
