import { 
  createJob, 
  createCandidate, 
  createAssessment, 
  createQuestion,
  JobStatus,
  CandidateStage,
  QuestionType
} from '../types/index.js';

// Generate unique IDs
let idCounter = 1;
const generateId = () => idCounter++;

// Helper to generate slug from title
const generateSlug = (title) => {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

// Job titles and descriptions
const jobTemplates = [
  { title: 'Senior Frontend Developer', description: 'Build amazing user interfaces with React', tags: ['React', 'JavaScript', 'CSS'] },
  { title: 'Backend Engineer', description: 'Design and build scalable backend systems', tags: ['Node.js', 'Python', 'API'] },
  { title: 'Full Stack Developer', description: 'Work across the entire technology stack', tags: ['React', 'Node.js', 'MongoDB'] },
  { title: 'DevOps Engineer', description: 'Manage infrastructure and deployment pipelines', tags: ['AWS', 'Docker', 'Kubernetes'] },
  { title: 'Product Manager', description: 'Drive product strategy and roadmap', tags: ['Strategy', 'Analytics', 'Leadership'] },
  { title: 'UX Designer', description: 'Create intuitive and beautiful user experiences', tags: ['Design', 'Figma', 'Research'] },
  { title: 'Data Scientist', description: 'Extract insights from complex datasets', tags: ['Python', 'ML', 'Statistics'] },
  { title: 'Mobile Developer', description: 'Build native mobile applications', tags: ['React Native', 'iOS', 'Android'] },
  { title: 'QA Engineer', description: 'Ensure software quality through testing', tags: ['Testing', 'Automation', 'Quality'] },
  { title: 'Security Engineer', description: 'Protect systems from security threats', tags: ['Security', 'Penetration Testing', 'Compliance'] },
  { title: 'Marketing Manager', description: 'Drive growth through marketing initiatives', tags: ['Marketing', 'Growth', 'Analytics'] },
  { title: 'Sales Representative', description: 'Build relationships and close deals', tags: ['Sales', 'CRM', 'Communication'] },
  { title: 'Customer Success Manager', description: 'Ensure customer satisfaction and retention', tags: ['Customer Service', 'Retention', 'Support'] },
  { title: 'HR Specialist', description: 'Manage talent acquisition and employee relations', tags: ['HR', 'Recruiting', 'People'] },
  { title: 'Finance Analyst', description: 'Analyze financial data and trends', tags: ['Finance', 'Excel', 'Analysis'] }
];

// Generate 25 jobs (mix of active and archived)
export const generateJobs = () => {
  const jobs = [];
  
  for (let i = 0; i < 25; i++) {
    const template = jobTemplates[i % jobTemplates.length];
    const job = createJob({
      id: generateId(),
      title: `${template.title} ${Math.floor(i / jobTemplates.length) > 0 ? `(${Math.floor(i / jobTemplates.length) + 1})` : ''}`,
      slug: generateSlug(`${template.title} ${Math.floor(i / jobTemplates.length) > 0 ? `${Math.floor(i / jobTemplates.length) + 1}` : ''}`),
      status: Math.random() > 0.8 ? JobStatus.ARCHIVED : JobStatus.ACTIVE,
      description: template.description,
      requirements: [
        `3+ years of experience in ${template.tags[0]}`,
        `Strong understanding of ${template.tags[1]}`,
        'Excellent communication skills',
        'Team player with leadership qualities'
      ],
      tags: template.tags,
      order: i,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
      updatedAt: new Date()
    });
    
    jobs.push(job);
  }
  
  return jobs;
};

// First names and last names for generating candidate names
const firstNames = [
  'Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Avery', 'Quinn', 'Sage', 'River',
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'William',
  'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia', 'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander',
  'Abigail', 'Michael', 'Emily', 'Daniel', 'Elizabeth', 'Matthew', 'Mila', 'Jackson', 'Ella', 'David',
  'Grace', 'Luke', 'Victoria', 'John', 'Aria', 'Anthony', 'Scarlett', 'Isaac', 'Chloe', 'Samuel'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'
];

const stages = Object.values(CandidateStage);

// Generate 1000 candidates randomly assigned to jobs
export const generateCandidates = (jobs) => {
  const candidates = [];
  
  for (let i = 0; i < 1000; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`;
    const randomJob = jobs[Math.floor(Math.random() * jobs.length)];
    const appliedAt = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000); // Random date within last 60 days
    
    const candidate = createCandidate({
      id: generateId(),
      name: `${firstName} ${lastName}`,
      email,
      stage: stages[Math.floor(Math.random() * stages.length)],
      jobId: randomJob.id,
      appliedAt,
      updatedAt: appliedAt,
      notes: [],
      timeline: [{
        id: generateId(),
        type: 'application',
        description: 'Applied for position',
        timestamp: appliedAt,
        metadata: {}
      }]
    });
    
    candidates.push(candidate);
  }
  
  return candidates;
};

// Assessment questions templates
const questionTemplates = {
  technical: [
    {
      type: QuestionType.SINGLE_CHOICE,
      question: 'What is the time complexity of binary search?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
      required: true
    },
    {
      type: QuestionType.MULTI_CHOICE,
      question: 'Which of the following are JavaScript frameworks? (Select all that apply)',
      options: ['React', 'Angular', 'Vue', 'Django', 'Flask'],
      required: true
    },
    {
      type: QuestionType.LONG_TEXT,
      question: 'Describe your experience with version control systems. How do you handle merge conflicts?',
      required: true,
      validation: { minLength: 100 }
    },
    {
      type: QuestionType.SHORT_TEXT,
      question: 'How many years of programming experience do you have?',
      required: true,
      validation: { pattern: '^[0-9]+$' }
    }
  ],
  behavioral: [
    {
      type: QuestionType.LONG_TEXT,
      question: 'Tell us about a time when you had to work with a difficult team member. How did you handle the situation?',
      required: true,
      validation: { minLength: 200 }
    },
    {
      type: QuestionType.SINGLE_CHOICE,
      question: 'How do you prefer to receive feedback?',
      options: ['In person', 'Via email', 'During team meetings', 'Through formal reviews'],
      required: true
    },
    {
      type: QuestionType.LONG_TEXT,
      question: 'Describe a project you\'re particularly proud of. What made it successful?',
      required: true,
      validation: { minLength: 150 }
    }
  ],
  general: [
    {
      type: QuestionType.SHORT_TEXT,
      question: 'What is your expected salary range?',
      required: false
    },
    {
      type: QuestionType.SINGLE_CHOICE,
      question: 'Are you willing to relocate?',
      options: ['Yes', 'No', 'Depends on the location'],
      required: true
    },
    {
      type: QuestionType.MULTI_CHOICE,
      question: 'What benefits are most important to you? (Select all that apply)',
      options: ['Health insurance', 'Flexible hours', 'Remote work', 'Professional development', 'Stock options'],
      required: false
    }
  ]
};

// Generate assessments for jobs (at least 3 assessments with 10+ questions each)
export const generateAssessments = (jobs) => {
  const assessments = [];
  
  // Create 3 main assessment types
  const assessmentTypes = [
    { title: 'Technical Assessment', questions: questionTemplates.technical },
    { title: 'Behavioral Assessment', questions: questionTemplates.behavioral },
    { title: 'General Assessment', questions: questionTemplates.general }
  ];
  
  // Generate assessments for random jobs
  const selectedJobs = jobs.slice(0, 10); // Use first 10 jobs for assessments
  
  selectedJobs.forEach(job => {
    assessmentTypes.forEach((type, index) => {
      const questions = type.questions.map((q, qIndex) => ({
        ...q,
        id: generateId(),
        conditionalLogic: qIndex > 0 && Math.random() > 0.7 ? {
          dependsOn: qIndex - 1,
          condition: 'equals',
          value: q.type === QuestionType.SINGLE_CHOICE ? q.options[0] : 'Yes'
        } : null
      }));
      
      // Add more questions to reach 10+
      while (questions.length < 10) {
        const randomTemplate = [...questionTemplates.technical, ...questionTemplates.behavioral, ...questionTemplates.general][
          Math.floor(Math.random() * (questionTemplates.technical.length + questionTemplates.behavioral.length + questionTemplates.general.length))
        ];
        questions.push({
          ...randomTemplate,
          id: generateId(),
          question: `${randomTemplate.question} (Additional)`,
          conditionalLogic: null
        });
      }
      
      const assessment = createAssessment({
        id: generateId(),
        jobId: job.id,
        title: `${job.title} - ${type.title}`,
        description: `Assessment for ${job.title} focusing on ${type.title.toLowerCase()} skills and fit.`,
        questions,
        createdAt: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      });
      
      assessments.push(assessment);
    });
  });
  
  return assessments;
};

// Main seed function
export const seedDatabase = async (db) => {
  try {
    // Clear existing data
    await db.jobs.clear();
    await db.candidates.clear();
    await db.assessments.clear();
    await db.assessmentResponses.clear();
    
    // Generate and insert data
    const jobs = generateJobs();
    const candidates = generateCandidates(jobs);
    const assessments = generateAssessments(jobs);
    
    await db.jobs.bulkAdd(jobs);
    await db.candidates.bulkAdd(candidates);
    await db.assessments.bulkAdd(assessments);
    
    console.log('Database seeded successfully!');
    console.log(`Created ${jobs.length} jobs, ${candidates.length} candidates, ${assessments.length} assessments`);
    
    return { jobs, candidates, assessments };
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};
