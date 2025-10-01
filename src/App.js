import React, { useEffect, Component } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Components
import Layout from './components/Layout/Layout';
import JobsBoard from './components/Jobs/JobsBoard';
import JobDetail from './components/Jobs/JobDetail';
import CandidatesBoard from './components/Candidates/CandidatesBoardSimplified';
import CandidateProfile from './components/Candidates/CandidateProfile';
import AssessmentBuilder from './components/Assessments/AssessmentBuilder';
import AssessmentForm from './components/Assessments/AssessmentForm';
import AssessmentJobSelector from './components/Assessments/AssessmentJobSelector';

// Database and mocking
import { db } from './database/db';

// Safely import seedDatabase with error handling
let seedDatabase;
try {
  const seedModule = require('./database/seedData');
  seedDatabase = seedModule.seedDatabase;
} catch (error) {
  console.error('Failed to import seedDatabase:', error);
  seedDatabase = async () => {
    console.log('SeedDatabase not available, skipping seeding');
  };
}

// Initialize MSW in development
if (process.env.NODE_ENV === 'development') {
  // Check if MSW is supported
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeMSW);
    } else {
      initializeMSW();
    }
  } else {
    console.warn('⚠️  MSW not supported in this environment');
  }
}

function initializeMSW() {
  try {
    console.log('🔄 Initializing MSW...');
    const { worker } = require('./mocks/browser');
    
    worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        url: '/mockServiceWorker.js'
      },
      quiet: false,
      waitUntilReady: true
    }).then(() => {
      console.log('✅ MSW worker started successfully');
      // Set a flag to indicate MSW is ready
      window.__MSW_READY__ = true;
      
      // Test MSW with a simple request
      fetch('/api/candidates?page=1&pageSize=10')
        .then(response => {
          console.log('✅ MSW test request successful:', response.status);
        })
        .catch(error => {
          console.warn('⚠️  MSW test request failed:', error);
        });
    }).catch((error) => {
      console.error('❌ Failed to start MSW worker:', error);
      console.log('⚠️  App will work without API mocking');
      window.__MSW_READY__ = false;
    });
  } catch (error) {
    console.error('❌ Error loading MSW:', error);
    window.__MSW_READY__ = false;
  }
}

// Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <p>Please refresh the page to try again.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{ padding: '10px 20px', fontSize: '16px' }}
          >
            Refresh Page
          </button>
          <details style={{ marginTop: '20px', textAlign: 'left' }}>
            <summary>Error Details</summary>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: '10px', 
              borderRadius: '4px',
              fontSize: '12px',
              maxHeight: '200px',
              overflow: 'auto'
            }}>
              {this.state.error?.toString()}
              {this.state.error?.stack && `\n\nStack trace:\n${this.state.error.stack}`}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  useEffect(() => {
    // Initialize database with seed data
    const initializeApp = async () => {
      try {
        console.log('Initializing app...');
        
        // Wait for database to be ready
        await db.open();
        console.log('Database opened successfully');
        
        // Check if database is already seeded
        const existingJobs = await db.jobs.count();
        console.log('Existing jobs count:', existingJobs);
        
        if (existingJobs === 0) {
          console.log('Seeding database...');
          await seedDatabase(db);
          console.log('Database seeded successfully');
        } else {
          console.log('Database already seeded with', existingJobs, 'jobs');
        }
        
        // Verify candidates exist
        const candidateCount = await db.candidates.count();
        console.log('Candidates count:', candidateCount);
        
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // Try to seed anyway
        try {
          console.log('Attempting to seed database after error...');
          await seedDatabase(db);
          console.log('Database seeded after error');
        } catch (seedError) {
          console.error('Failed to seed database:', seedError);
          // Set a flag to indicate database issues
          window.__DB_ERROR__ = true;
        }
      }
    };

    // Add a small delay to ensure MSW is ready
    setTimeout(() => {
      initializeApp();
    }, 100);
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/jobs" replace />} />
              <Route path="jobs" element={<JobsBoard />} />
              <Route path="jobs/:jobId" element={<JobDetail />} />
              <Route path="candidates" element={<CandidatesBoard />} />
              <Route path="candidates/:candidateId" element={<CandidateProfile />} />
              <Route path="assessments" element={<AssessmentJobSelector />} />
              <Route path="jobs/:jobId/assessments/:assessmentId/builder" element={<AssessmentBuilder />} />
              <Route path="jobs/:jobId/assessments/:assessmentId/form" element={<AssessmentForm />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
