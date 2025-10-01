import { http, HttpResponse, delay } from 'msw';
import { dbOperations } from '../database/db.js';

// Simulate network latency (200-1200ms)
const simulateLatency = async () => {
  const latency = Math.random() * 1000 + 200; // 200-1200ms
  await delay(latency);
};

// Simulate 5-10% error rate on write operations
const simulateErrorRate = () => {
  return Math.random() < 0.075; // 7.5% error rate
};

// Simulate higher error rate for job reordering (as specified in requirements)
const simulateReorderErrorRate = () => {
  return Math.random() < 0.15; // 15% error rate for reordering
};

// Error responses
const serverError = () => {
  return HttpResponse.json(
    { error: 'Internal server error', message: 'Something went wrong' },
    { status: 500 }
  );
};

export const handlers = [
  // Jobs endpoints
  http.get('/api/jobs', async ({ request }) => {
    await simulateLatency();
    
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const sort = url.searchParams.get('sort') || 'order';
    
    try {
      let jobs = await dbOperations.getAllJobs();
      
      // Ensure jobs is an array
      if (!Array.isArray(jobs)) {
        jobs = [];
      }
      
      // Filter by search
      if (search) {
        jobs = jobs.filter(job => 
          job.title?.toLowerCase().includes(search.toLowerCase()) ||
          (job.tags && job.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())))
        );
      }
      
      // Filter by status
      if (status) {
        jobs = jobs.filter(job => job.status === status);
      }
      
      // Sort
      if (sort === 'title') {
        jobs.sort((a, b) => a.title.localeCompare(b.title));
      } else if (sort === 'createdAt') {
        jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
      
      // Paginate
      const total = jobs.length;
      const startIndex = (page - 1) * pageSize;
      const paginatedJobs = jobs.slice(startIndex, startIndex + pageSize);
      
      return HttpResponse.json({
        jobs: paginatedJobs,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      });
    } catch (error) {
      return serverError();
    }
  }),

  http.get('/api/jobs/:id', async ({ params }) => {
    await simulateLatency();
    
    try {
      const job = await dbOperations.getJobById(parseInt(params.id));
      if (!job) {
        return HttpResponse.json({ error: 'Job not found' }, { status: 404 });
      }
      return HttpResponse.json(job);
    } catch (error) {
      return serverError();
    }
  }),

  http.post('/api/jobs', async ({ request }) => {
    await simulateLatency();
    
    if (simulateErrorRate()) {
      return serverError();
    }
    
    try {
      const jobData = await request.json();
      const id = await dbOperations.createJob(jobData);
      const job = await dbOperations.getJobById(id);
      return HttpResponse.json(job, { status: 201 });
    } catch (error) {
      return serverError();
    }
  }),

  http.patch('/api/jobs/:id', async ({ params, request }) => {
    await simulateLatency();
    
    if (simulateErrorRate()) {
      return serverError();
    }
    
    try {
      const updates = await request.json();
      await dbOperations.updateJob(parseInt(params.id), updates);
      const job = await dbOperations.getJobById(parseInt(params.id));
      return HttpResponse.json(job);
    } catch (error) {
      return serverError();
    }
  }),

  http.patch('/api/jobs/:id/reorder', async ({ params, request }) => {
    await simulateLatency();
    
    if (simulateReorderErrorRate()) {
      return HttpResponse.json(
        { error: 'Failed to reorder', message: 'Please try again' },
        { status: 500 }
      );
    }
    
    try {
      const { fromOrder, toOrder } = await request.json();
      const jobs = await dbOperations.getAllJobs();
      
      // Update order for reordering
      const updatedJobs = jobs.map(job => {
        if (job.id === parseInt(params.id)) {
          return { ...job, order: toOrder };
        } else if (fromOrder < toOrder && job.order > fromOrder && job.order <= toOrder) {
          return { ...job, order: job.order - 1 };
        } else if (fromOrder > toOrder && job.order >= toOrder && job.order < fromOrder) {
          return { ...job, order: job.order + 1 };
        }
        return job;
      });
      
      await dbOperations.reorderJobs(updatedJobs);
      return HttpResponse.json({ success: true });
    } catch (error) {
      return serverError();
    }
  }),

  // Candidates endpoints
  http.get('/api/candidates', async ({ request }) => {
    await simulateLatency();
    
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const stage = url.searchParams.get('stage') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '50');
    
    try {
      let candidates = await dbOperations.getAllCandidates();
      
      // Ensure candidates is an array
      if (!Array.isArray(candidates)) {
        candidates = [];
      }
      
      // Filter by search (name/email)
      if (search) {
        candidates = candidates.filter(candidate => 
          candidate.name?.toLowerCase().includes(search.toLowerCase()) ||
          candidate.email?.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      // Filter by stage
      if (stage) {
        candidates = candidates.filter(candidate => candidate.stage === stage);
      }
      
      // Sort by most recent
      candidates.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      
      // Paginate
      const total = candidates.length;
      const startIndex = (page - 1) * pageSize;
      const paginatedCandidates = candidates.slice(startIndex, startIndex + pageSize);
      
      return HttpResponse.json({
        candidates: paginatedCandidates,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      });
    } catch (error) {
      return serverError();
    }
  }),

  http.get('/api/candidates/:id', async ({ params }) => {
    await simulateLatency();
    
    try {
      const candidate = await dbOperations.getCandidateById(parseInt(params.id));
      if (!candidate) {
        return HttpResponse.json({ error: 'Candidate not found' }, { status: 404 });
      }
      return HttpResponse.json(candidate);
    } catch (error) {
      return serverError();
    }
  }),

  http.get('/api/candidates/:id/timeline', async ({ params }) => {
    await simulateLatency();
    
    try {
      const candidate = await dbOperations.getCandidateById(parseInt(params.id));
      if (!candidate) {
        return HttpResponse.json({ error: 'Candidate not found' }, { status: 404 });
      }
      return HttpResponse.json(candidate.timeline || []);
    } catch (error) {
      return serverError();
    }
  }),

  http.post('/api/candidates', async ({ request }) => {
    await simulateLatency();
    
    if (simulateErrorRate()) {
      return serverError();
    }
    
    try {
      const candidateData = await request.json();
      const id = await dbOperations.createCandidate(candidateData);
      const candidate = await dbOperations.getCandidateById(id);
      return HttpResponse.json(candidate, { status: 201 });
    } catch (error) {
      return serverError();
    }
  }),

  http.patch('/api/candidates/:id', async ({ params, request }) => {
    await simulateLatency();
    
    if (simulateErrorRate()) {
      return serverError();
    }
    
    try {
      const updates = await request.json();
      
      // Handle stage transitions specially
      if (updates.stage) {
        await dbOperations.updateCandidateStage(parseInt(params.id), updates.stage);
      } else {
        await dbOperations.updateCandidate(parseInt(params.id), updates);
      }
      
      const candidate = await dbOperations.getCandidateById(parseInt(params.id));
      return HttpResponse.json(candidate);
    } catch (error) {
      return serverError();
    }
  }),

  // Assessments endpoints
  http.get('/api/assessments/:jobId', async ({ params }) => {
    await simulateLatency();
    
    try {
      const assessments = await dbOperations.getAssessmentsByJob(parseInt(params.jobId));
      return HttpResponse.json(assessments);
    } catch (error) {
      return serverError();
    }
  }),

  http.get('/api/assessments/:jobId/:assessmentId', async ({ params }) => {
    await simulateLatency();
    
    try {
      console.log('Getting assessment:', params.assessmentId, 'for job:', params.jobId);
      const assessment = await dbOperations.getAssessmentById(parseInt(params.assessmentId));
      console.log('Found assessment:', assessment);
      if (!assessment) {
        console.log('Assessment not found, returning 404');
        return HttpResponse.json({ error: 'Assessment not found' }, { status: 404 });
      }
      return HttpResponse.json(assessment);
    } catch (error) {
      console.error('Error getting assessment:', error);
      return serverError();
    }
  }),

  http.post('/api/assessments/:jobId', async ({ params, request }) => {
    await simulateLatency();
    
    if (simulateErrorRate()) {
      return serverError();
    }
    
    try {
      const assessmentData = await request.json();
      console.log('Creating assessment:', assessmentData);
      console.log('Job ID:', params.jobId);
      
      // Check if assessment with same title already exists for this job
      const existingAssessments = await dbOperations.getAssessmentsByJob(parseInt(params.jobId));
      const duplicateAssessment = existingAssessments.find(a => a.title === assessmentData.title);
      
      if (duplicateAssessment) {
        console.log('Assessment with same title already exists, updating instead');
        const updatedAssessment = await dbOperations.updateAssessment(duplicateAssessment.id, {
          ...assessmentData,
          updatedAt: new Date()
        });
        return HttpResponse.json({ success: true, assessment: updatedAssessment, message: 'Assessment updated successfully' });
      }
      
      const newAssessment = await dbOperations.createAssessment({
        ...assessmentData,
        id: Math.floor(Math.random() * 1000000), // Generate a random ID
        jobId: parseInt(params.jobId),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Assessment created:', newAssessment);
      return HttpResponse.json({ success: true, assessment: newAssessment, message: 'Assessment created successfully' });
    } catch (error) {
      console.error('Error creating assessment:', error);
      return serverError();
    }
  }),

  http.put('/api/assessments/:jobId/:assessmentId', async ({ params, request }) => {
    await simulateLatency();
    
    if (simulateErrorRate()) {
      return serverError();
    }
    
    try {
      const assessmentData = await request.json();
      await dbOperations.updateAssessment(parseInt(params.assessmentId), assessmentData);
      const assessment = await dbOperations.getAssessmentById(parseInt(params.assessmentId));
      return HttpResponse.json(assessment);
    } catch (error) {
      return serverError();
    }
  }),

  http.post('/api/assessments/:jobId/:assessmentId/submit', async ({ params, request }) => {
    await simulateLatency();
    
    if (simulateErrorRate()) {
      return serverError();
    }
    
    try {
      const responseData = await request.json();
      await dbOperations.saveAssessmentResponse({
        ...responseData,
        assessmentId: parseInt(params.assessmentId),
        submittedAt: new Date()
      });
      return HttpResponse.json({ success: true, message: 'Response saved successfully' });
    } catch (error) {
      return serverError();
    }
  }),

  // Candidate notes endpoints
  http.post('/api/candidates/:id/notes', async ({ params, request }) => {
    await simulateLatency();
    
    if (simulateErrorRate()) {
      return serverError();
    }
    
    try {
      const noteData = await request.json();
      await dbOperations.addCandidateNote(parseInt(params.id), noteData);
      return HttpResponse.json({ success: true, message: 'Note added successfully' });
    } catch (error) {
      return serverError();
    }
  })
];
