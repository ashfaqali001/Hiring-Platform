import React, { useState, useEffect, useCallback } from 'react';
import { List } from 'react-window';
import { InfiniteLoader } from 'react-window-infinite-loader';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import CandidateListItem from './CandidateListItem';
import './CandidatesBoard.css';

const ITEM_HEIGHT = 80;
const KANBAN_STAGES = [
  { id: 'applied', title: 'Applied', color: '#3182ce' },
  { id: 'screen', title: 'Screening', color: '#d53f8c' },
  { id: 'tech', title: 'Technical', color: '#dd6b20' },
  { id: 'offer', title: 'Offer', color: '#38a169' },
  { id: 'hired', title: 'Hired', color: '#319795' },
  { id: 'rejected', title: 'Rejected', color: '#e53e3e' }
];

const CandidatesBoard = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
  const [hasNextPage, setHasNextPage] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCandidates, setTotalCandidates] = useState(0);

  // Ensure candidates is always an array
  const safeCandidates = Array.isArray(candidates) ? candidates : [];

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

      console.log('Fetching candidates, page:', page, 'reset:', reset);

      // Try MSW API first
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: '50',
          ...(searchTerm && { search: searchTerm }),
          ...(stageFilter && { stage: stageFilter })
        });

        console.log('Making API request to:', `/api/candidates?${params}`);
        const response = await fetch(`/api/candidates?${params}`);
        
        console.log('API response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Response is not JSON. MSW might not be running.');
        }
        
        const data = await response.json();
        console.log('API response data:', data);
        
        // Ensure data structure is correct
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid response format');
        }
        
        const candidates = data.candidates || [];
        console.log('Candidates from API:', safeCandidates.length);
        
        if (reset) {
          setCandidates(candidates);
        } else {
          setCandidates(prev => [...prev, ...candidates]);
        }
        
        setTotalCandidates(data.pagination?.total || 0);
        setHasNextPage(page < (data.pagination?.totalPages || 1));
        setCurrentPage(page);
        setError(null);
        return;
      } catch (apiError) {
        console.warn('MSW API failed, trying direct database access:', apiError.message);
        
        // Fallback to direct database access
        try {
          const { dbOperations } = await import('../../database/db');
          console.log('Using direct database access');
          
          const allCandidates = await dbOperations.getAllCandidates();
          console.log('All candidates from DB:', allCandidates.length);
          
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
          
          console.log('Filtered candidates:', filteredCandidates.length, 'Paginated:', paginatedCandidates.length);
          
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
          console.error('Database access failed:', dbError);
          
          // If database fails, try to provide some mock data as fallback
          console.log('Database failed, providing mock data as fallback');
          const mockCandidates = [
            {
              id: 1,
              name: 'John Doe',
              email: 'john.doe@example.com',
              stage: 'applied',
              jobId: 1,
              appliedAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 2,
              name: 'Jane Smith',
              email: 'jane.smith@example.com',
              stage: 'screen',
              jobId: 1,
              appliedAt: new Date(),
              updatedAt: new Date()
            }
          ];
          
          if (reset) {
            setCandidates(mockCandidates);
            setTotalCandidates(mockCandidates.length);
            setHasNextPage(false);
            setCurrentPage(1);
            setError('Using mock data - database not available. Please refresh to retry.');
          }
          return;
        }
      }
    } catch (err) {
      console.error('Error fetching candidates:', err);
      setError(`Failed to load candidates: ${err.message}`);
      if (reset) {
        setCandidates([]);
      }
    } finally {
      setLoading(false);
    }
  }, [searchTerm, stageFilter, candidates]);

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

      const updatedCandidates = [...candidates];
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
          setCandidates(candidates);
          throw new Error('Failed to update candidate stage');
        }
      } catch (err) {
        setError(err.message);
        // Refresh to get correct data
        await fetchCandidates(1, true);
      }
    }
  };

  const getCandidatesByStage = () => {
    try {
      const grouped = {};
      KANBAN_STAGES.forEach(stage => {
        grouped[stage.id] = safeCandidates.filter(candidate => 
          candidate && candidate.stage === stage.id
        );
      });
      return grouped;
    } catch (error) {
      console.error('Error in getCandidatesByStage:', error);
      // Return empty grouped object as fallback
      const grouped = {};
      KANBAN_STAGES.forEach(stage => {
        grouped[stage.id] = [];
      });
      return grouped;
    }
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

  if (loading && safeCandidates.length === 0) {
    return (
      <div className="candidates-board">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading candidates...</p>
        </div>
      </div>
    );
  }

  // Add error boundary for candidates data
  if (!safeCandidates || safeCandidates.length === 0) {
    return (
      <div className="candidates-board">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h2>Error Loading Candidates</h2>
          <p>Failed to load candidates data. Please refresh the page.</p>
          <button 
            className="btn btn-primary" 
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
          <details style={{ marginTop: '20px', textAlign: 'left' }}>
            <summary>Debug Information</summary>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: '10px', 
              borderRadius: '4px',
              fontSize: '12px',
              maxHeight: '200px',
              overflow: 'auto'
            }}>
              MSW Ready: {window.__MSW_READY__ ? 'Yes' : 'No'}
              DB Error: {window.__DB_ERROR__ ? 'Yes' : 'No'}
              Candidates: {typeof safeCandidates} - {Array.isArray(safeCandidates) ? safeCandidates.length : 'Not an array'}
            </pre>
          </details>
        </div>
      </div>
    );
  }

  let candidatesByStage;
  try {
    candidatesByStage = getCandidatesByStage();
  } catch (error) {
    console.error('Error getting candidates by stage:', error);
    // Fallback to empty grouped object
    candidatesByStage = {};
    KANBAN_STAGES.forEach(stage => {
      candidatesByStage[stage.id] = [];
    });
  }

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

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          {error}
          <button className="error-close" onClick={() => setError(null)}>×</button>
        </div>
      )}

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
            <InfiniteLoader
              isItemLoaded={isItemLoaded}
              itemCount={hasNextPage ? safeCandidates.length + 1 : safeCandidates.length}
              loadMoreItems={loadMoreItems}
            >
              {({ onItemsRendered, ref }) => (
                <List
                  ref={ref}
                  height={600}
                  itemCount={safeCandidates.length}
                  itemSize={ITEM_HEIGHT}
                  onItemsRendered={onItemsRendered}
                  className="candidates-virtual-list"
                >
                  {({ index, style }) => (
                    <div style={style}>
                      <CandidateListItem
                        candidate={safeCandidates[index]}
                        formatDate={formatDate}
                      />
                    </div>
                  )}
                </List>
              )}
            </InfiniteLoader>
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

      {viewMode === 'list' && hasNextPage && (
        <div className="load-more-section">
          <button
            className="btn btn-secondary"
            onClick={loadMoreItems}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More Candidates'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CandidatesBoard;
