import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Components
import Layout from './components/Layout/Layout';
import JobsBoard from './components/Jobs/JobsBoard';
import JobDetail from './components/Jobs/JobDetail';
import CandidatesBoard from './components/Candidates/CandidatesBoard';
import CandidateProfile from './components/Candidates/CandidateProfile';
import AssessmentBuilder from './components/Assessments/AssessmentBuilder';
import AssessmentForm from './components/Assessments/AssessmentForm';

// Database and mocking
import { db } from './database/db';
import { seedDatabase } from './database/seedData';

// Initialize MSW in development
if (process.env.NODE_ENV === 'development') {
  const { worker } = require('./mocks/browser');
  worker.start({
    onUnhandledRequest: 'bypass',
  });
}

function App() {
  useEffect(() => {
    // Initialize database with seed data
    const initializeApp = async () => {
      try {
        // Check if database is already seeded
        const existingJobs = await db.jobs.count();
        if (existingJobs === 0) {
          console.log('Seeding database...');
          await seedDatabase(db);
        } else {
          console.log('Database already seeded');
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();
  }, []);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/jobs" replace />} />
            <Route path="jobs" element={<JobsBoard />} />
            <Route path="jobs/:jobId" element={<JobDetail />} />
            <Route path="candidates" element={<CandidatesBoard />} />
            <Route path="candidates/:candidateId" element={<CandidateProfile />} />
            <Route path="jobs/:jobId/assessments/:assessmentId/builder" element={<AssessmentBuilder />} />
            <Route path="jobs/:jobId/assessments/:assessmentId/form" element={<AssessmentForm />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
