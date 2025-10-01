import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../../database/db';
import './CandidateProfile.css';

const CandidateProfile = () => {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        setLoading(true);
        console.log('Fetching candidate:', candidateId);
        
        // Fetch candidate details
        const candidateResponse = await fetch(`/api/candidates/${candidateId}`);
        console.log('Candidate response:', candidateResponse.status, candidateResponse.ok);
        
        // Check if we got HTML instead of JSON (MSW not working)
        const contentType = candidateResponse.headers.get('content-type');
        console.log('Response content-type:', contentType);
        
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Received non-JSON response, MSW might not be working');
          console.log('Falling back to direct database access...');
          
          // Fallback: fetch directly from database
          const candidate = await db.candidates.get(parseInt(candidateId));
          if (!candidate) {
            // Check if database has any candidates
            const allCandidates = await db.candidates.toArray();
            console.log('Database has', allCandidates.length, 'candidates');
            console.log('Available candidate IDs:', allCandidates.slice(0, 10).map(c => c.id));
            
            if (allCandidates.length === 0) {
              throw new Error('No candidates found in database. Please refresh the page to reinitialize.');
            } else {
              throw new Error(`Candidate with ID ${candidateId} not found. Available IDs: ${allCandidates.slice(0, 5).map(c => c.id).join(', ')}...`);
            }
          }
          
          setCandidate(candidate);
          setTimeline(candidate.timeline || []);
          setNotes(candidate.notes || []);
          return;
        }
        if (!candidateResponse.ok) {
          if (candidateResponse.status === 404) {
            // Try direct database access as fallback
            console.log('API returned 404, trying direct database access...');
            const candidate = await db.candidates.get(parseInt(candidateId));
            if (!candidate) {
              const allCandidates = await db.candidates.toArray();
              console.log('Database has', allCandidates.length, 'candidates');
              if (allCandidates.length === 0) {
                throw new Error('No candidates found in database. Please refresh the page to reinitialize.');
              } else {
                throw new Error(`Candidate with ID ${candidateId} not found. Available IDs: ${allCandidates.slice(0, 5).map(c => c.id).join(', ')}...`);
              }
            }
            
            setCandidate(candidate);
            setTimeline(candidate.timeline || []);
            setNotes(candidate.notes || []);
            return;
          } else {
            throw new Error(`Failed to load candidate (${candidateResponse.status})`);
          }
        }
        let candidateData;
        try {
          candidateData = await candidateResponse.json();
        } catch (jsonError) {
          console.error('JSON parsing error:', jsonError);
          throw new Error('Invalid response format from server');
        }
        setCandidate(candidateData);
        
        // Fetch timeline
        try {
          const timelineResponse = await fetch(`/api/candidates/${candidateId}/timeline`);
          if (timelineResponse.ok) {
            const timelineData = await timelineResponse.json();
            setTimeline(timelineData);
          }
        } catch (timelineError) {
          console.warn('Failed to fetch timeline:', timelineError);
          // Use candidate's timeline if available
          setTimeline(candidateData.timeline || []);
        }
        
        // Set notes from candidate data
        setNotes(candidateData.notes || []);
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidate();
  }, [candidateId]);

  const handleStageChange = async (newStage) => {
    try {
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stage: newStage })
      });

      if (response.ok) {
        setCandidate(prev => ({ ...prev, stage: newStage }));
        // Add timeline entry
        const timelineEntry = {
          id: Date.now(),
          type: 'stage_change',
          description: `Moved to ${newStage}`,
          timestamp: new Date(),
          metadata: { fromStage: candidate.stage, toStage: newStage }
        };
        setTimeline(prev => [timelineEntry, ...prev]);
      }
    } catch (err) {
      console.error('Failed to update stage:', err);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      const note = {
        id: Date.now(),
        content: newNote,
        author: 'Current User',
        createdAt: new Date(),
        mentions: extractMentions(newNote)
      };

      console.log('Adding note:', note);

      // Add note locally first
      setNotes(prev => [note, ...prev]);
      setNewNote('');

      // Send to server
      console.log('Sending note to server...');
      const response = await fetch(`/api/candidates/${candidateId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(note)
      });

      console.log('Note response:', response.status, response.ok);

      if (!response.ok) {
        console.error('Failed to save note to server, trying direct database access...');
        
        // Try direct database access as fallback
        try {
          await db.candidates.update(parseInt(candidateId), {
            notes: [...notes, note],
            updatedAt: new Date()
          });
          console.log('Note saved directly to database');
        } catch (dbError) {
          console.error('Failed to save note to database:', dbError);
          // Rollback on failure
          setNotes(prev => prev.filter(n => n.id !== note.id));
          alert('Failed to save note. Please try again.');
        }
      } else {
        console.log('Note saved successfully');
      }
    } catch (err) {
      console.error('Failed to add note:', err);
      alert('Failed to add note. Please try again.');
    }
  };

  const extractMentions = (text) => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  };

  const formatDate = (date) => {
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="candidate-profile">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading candidate profile...</p>
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="candidate-profile">
        <div className="error-state">
          <h2>Candidate Not Found</h2>
          <p>{error || 'The candidate you\'re looking for doesn\'t exist.'}</p>
          <Link to="/candidates" className="btn btn-primary">
            Back to Candidates
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="candidate-profile">
      <div className="breadcrumb">
        <Link to="/candidates">Candidates</Link>
        <span>›</span>
        <span>{candidate.name}</span>
      </div>
      
      <div className="profile-header">
        <div className="candidate-avatar-large">
          <div className="avatar-circle-large">
            {candidate.name.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="candidate-details">
          <h1>{candidate.name}</h1>
          <p>{candidate.email}</p>
          <div className="stage-badge-large">
            {candidate.stage}
          </div>
        </div>
      </div>
      
      <div className="profile-content">
        <div className="profile-grid">
          <div className="profile-main">
            <div className="info-section">
              <h3>Candidate Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Email:</label>
                  <span>{candidate.email}</span>
                </div>
                <div className="info-item">
                  <label>Current Stage:</label>
                  <select 
                    value={candidate.stage} 
                    onChange={(e) => handleStageChange(e.target.value)}
                    className="stage-select"
                  >
                    <option value="applied">Applied</option>
                    <option value="screen">Screening</option>
                    <option value="tech">Technical</option>
                    <option value="offer">Offer</option>
                    <option value="hired">Hired</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="info-item">
                  <label>Job ID:</label>
                  <span>#{candidate.jobId}</span>
                </div>
                <div className="info-item">
                  <label>Applied:</label>
                  <span>{formatDate(candidate.appliedAt)}</span>
                </div>
              </div>
            </div>

            <div className="notes-section">
              <h3>Notes & Comments</h3>
              <div className="add-note">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note about this candidate... Use @username to mention someone"
                  className="note-input"
                />
                <button 
                  onClick={handleAddNote}
                  className="btn btn-primary"
                  disabled={!newNote.trim()}
                >
                  Add Note
                </button>
              </div>
              
              <div className="notes-list">
                {notes.map(note => (
                  <div key={note.id} className="note-item">
                    <div className="note-header">
                      <span className="note-author">{note.author}</span>
                      <span className="note-date">{formatDate(note.createdAt)}</span>
                    </div>
                    <div className="note-content">
                      {note.content.split(' ').map((word, index) => 
                        word.startsWith('@') ? (
                          <span key={index} className="mention">@{word.substring(1)}</span>
                        ) : (
                          <span key={index}>{word} </span>
                        )
                      )}
                    </div>
                    {note.mentions && note.mentions.length > 0 && (
                      <div className="note-mentions">
                        Mentions: {note.mentions.map(mention => `@${mention}`).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="profile-sidebar">
            <div className="timeline-section">
              <h3>Activity Timeline</h3>
              <div className="timeline">
                {timeline.map((entry, index) => (
                  <div key={entry.id || index} className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <div className="timeline-description">{entry.description}</div>
                      <div className="timeline-date">{formatDate(entry.timestamp)}</div>
                      {entry.metadata && (
                        <div className="timeline-metadata">
                          {entry.metadata.fromStage && (
                            <span>From: {entry.metadata.fromStage}</span>
                          )}
                          {entry.metadata.toStage && (
                            <span>To: {entry.metadata.toStage}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateProfile;
