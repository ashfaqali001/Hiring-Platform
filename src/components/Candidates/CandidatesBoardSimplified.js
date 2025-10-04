import React, { useState, useEffect, useCallback } from 'react';
// import { List } from 'react-window';
// import { InfiniteLoader } from 'react-window-infinite-loader';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import CandidateListItem from './CandidateListItem';
import KanbanColumn from './KanbanColumn';
import './CandidatesBoard.css';

const KANBAN_STAGES = [
  { id: 'applied', title: 'Applied', color: '#3182ce' },
  { id: 'screen', title: 'Screening', color: '#d53f8c' },
  { id: 'tech', title: 'Technical', color: '#dd6b20' },
  { id: 'offer', title: 'Offer', color: '#38a169' },
  { id: 'hired', title: 'Hired', color: '#319795' },
  { id: 'rejected', title: 'Rejected', color: '#e53e3e' }
];

const ITEM_HEIGHT = 80;

const CandidatesBoardSimplified = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [hasNextPage, setHasNextPage] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCandidates, setTotalCandidates] = useState(0);

  // Safe candidates getter
  const safeCandidates = Array.isArray(candidates) ? candidates : [];

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchCandidates = useCallback(async (page = 1, reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setCandidates([]);
        setCurrentPage(1);
        setError(null);
      }

      // Try API first
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: '50',
          ...(searchTerm && { search: searchTerm }),
          ...(stageFilter && { stage: stageFilter })
        });

        const response = await fetch(`/api/candidates?${params}`);
        if (response.ok) {
          const data = await response.json();
          const newCandidates = data.candidates || [];
          
          if (reset) {
            setCandidates(newCandidates);
          } else {
            setCandidates(prev => [...prev, ...newCandidates]);
          }
          
          setTotalCandidates(data.pagination?.total || 0);
          setHasNextPage(page < (data.pagination?.totalPages || 1));
          setCurrentPage(page);
          setError(null);
          return;
        }
      } catch (apiError) {
        console.warn('API failed, trying database:', apiError);
      }

      // Fallback to database
      try {
        const { dbOperations } = await import('../../database/db');
        const allCandidates = await dbOperations.getAllCandidates();
        
        // Apply filters
        let filteredCandidates = allCandidates;
        
        if (searchTerm) {
          filteredCandidates = filteredCandidates.filter(candidate => 
            candidate.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            candidate.email?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        if (stageFilter) {
          filteredCandidates = filteredCandidates.filter(candidate => 
            candidate.stage === stageFilter
          );
        }
        
        // Apply pagination
        const pageSize = 50;
        const startIndex = (page - 1) * pageSize;
        const paginatedCandidates = filteredCandidates.slice(startIndex, startIndex + pageSize);
        
        if (reset) {
          setCandidates(paginatedCandidates);
        } else {
          setCandidates(prev => [...prev, ...paginatedCandidates]);
        }
        
        setTotalCandidates(filteredCandidates.length);
        setHasNextPage(startIndex + pageSize < filteredCandidates.length);
        setCurrentPage(page);
        setError(null);
      } catch (dbError) {
        console.warn('Database failed, using mock data:', dbError);
        // Mock data fallback
        const mockCandidates = [
          { id: 1, name: 'John Doe', email: 'john@example.com', stage: 'applied' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', stage: 'screen' }
        ];
        
        if (reset) {
          setCandidates(mockCandidates);
        } else {
          setCandidates(prev => [...prev, ...mockCandidates]);
        }
        
        setTotalCandidates(mockCandidates.length);
        setHasNextPage(false);
        setCurrentPage(page);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching candidates:', err);
      setError('Failed to load candidates');
      if (reset) {
        setCandidates([]);
      }
    } finally {
      setLoading(false);
    }
  }, [searchTerm, stageFilter]);

  useEffect(() => {
    fetchCandidates(1, true);
  }, [fetchCandidates]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStageFilter = (e) => {
    setStageFilter(e.target.value);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  const loadMoreItems = () => {
    if (hasNextPage && !loading) {
      fetchCandidates(currentPage + 1, false);
    }
  };

  const isItemLoaded = (index) => !!safeCandidates[index];

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // Handle stage change in kanban view
    if (viewMode === 'kanban') {
      const candidateId = active.id;
      const newStage = over.id;
      
      // Find the candidate and update optimistically
      const candidateIndex = safeCandidates.findIndex(c => c.id === candidateId);
      if (candidateIndex === -1) return;

      const updatedCandidates = [...safeCandidates];
      updatedCandidates[candidateIndex] = {
        ...updatedCandidates[candidateIndex],
        stage: newStage
      };
      setCandidates(updatedCandidates);

      try {
        const response = await fetch(`/api/candidates/${candidateId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ stage: newStage })
        });

        if (!response.ok) {
          // Rollback on failure
          setCandidates(safeCandidates);
          throw new Error('Failed to update candidate stage');
        }
      } catch (err) {
        setError(err.message);
        // Refresh to get correct data
        await fetchCandidates(1, true);
      }
    }
  };

  // Filter candidates
  const filteredCandidates = safeCandidates.filter(candidate => {
    const matchesSearch = !searchTerm || 
      candidate.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStage = !stageFilter || candidate.stage === stageFilter;
    
    return matchesSearch && matchesStage;
  });

  // Group candidates by stage for kanban view
  const getCandidatesByStage = () => {
    const grouped = {};
    KANBAN_STAGES.forEach(stage => {
      grouped[stage.id] = filteredCandidates.filter(candidate => 
        candidate.stage === stage.id
      );
    });
    return grouped;
  };

  const formatDate = (date) => {
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="candidates-board">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading candidates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="candidates-board">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h2>Error Loading Candidates</h2>
          <p>{error}</p>
          <button 
            className="btn btn-primary" 
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  const candidatesByStage = getCandidatesByStage();

  return (
    <div className="candidates-board">
      <div className="candidates-header">
        <div className="header-content">
          <h1>Candidates</h1>
          <p className="header-subtitle">
            {totalCandidates} candidates across all stages
          </p>
        </div>
        <div className="view-toggle">
          <button
            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('list')}
          >
            📋 List View
          </button>
          <button
            className={`toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('kanban')}
          >
            📊 Kanban View
          </button>
        </div>
      </div>

      <div className="candidates-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search candidates by name or email..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
        
        <div className="filters">
          <select value={stageFilter} onChange={handleStageFilter} className="filter-select">
            <option value="">All Stages</option>
            {KANBAN_STAGES.map(stage => (
              <option key={stage.id} value={stage.id}>
                {stage.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="candidates-list-view">
          {safeCandidates.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h3>No candidates found</h3>
              <p>Candidates will appear here as they apply for jobs</p>
            </div>
          ) : (
            <div className="candidates-list">
              {safeCandidates.map(candidate => (
                <CandidateListItem
                  key={candidate.id}
                  candidate={candidate}
                  formatDate={formatDate}
                />
              ))}
              {hasNextPage && (
                <div className="load-more-section">
                  <button 
                    className="btn btn-outline"
                    onClick={() => loadMoreItems()}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="candidates-kanban-view">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="kanban-board">
              {KANBAN_STAGES.map(stage => (
                <KanbanColumn
                  key={stage.id}
                  stage={stage}
                  candidates={candidatesByStage[stage.id] || []}
                  formatDate={formatDate}
                />
              ))}
            </div>
          </DndContext>
        </div>
      )}
    </div>
  );
};

export default CandidatesBoardSimplified;
