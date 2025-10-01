import React, { useState, useEffect } from 'react';

const CandidatesBoardMinimal = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simple data loading with error handling
    const loadCandidates = async () => {
      try {
        setLoading(true);
        
        // Try to fetch candidates with multiple fallbacks
        let candidatesData = [];
        
        try {
          const response = await fetch('/api/candidates?page=1&pageSize=10');
          if (response.ok) {
            const data = await response.json();
            candidatesData = data.candidates || [];
          }
        } catch (apiError) {
          console.warn('API failed, using mock data:', apiError);
          // Fallback to mock data
          candidatesData = [
            { id: 1, name: 'John Doe', email: 'john@example.com', stage: 'applied' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com', stage: 'screen' }
          ];
        }
        
        setCandidates(candidatesData);
        setError(null);
      } catch (err) {
        console.error('Error loading candidates:', err);
        setError('Failed to load candidates');
        setCandidates([]);
      } finally {
        setLoading(false);
      }
    };

    loadCandidates();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading candidates...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Error Loading Candidates</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Candidates ({candidates.length})</h1>
      <div>
        {candidates.length === 0 ? (
          <p>No candidates found</p>
        ) : (
          <ul>
            {candidates.map(candidate => (
              <li key={candidate.id}>
                {candidate.name} - {candidate.email} ({candidate.stage})
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CandidatesBoardMinimal;
