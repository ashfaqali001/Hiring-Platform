import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy } from '@dnd-kit/sortable';
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

  const fetchCandidates = async (page = 1, reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setCandidates([]);
        setCurrentPage(1);
      }

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '50',
        ...(searchTerm && { search: searchTerm }),
        ...(stageFilter && { stage: stageFilter })
      });

      const response = await fetch(`/api/candidates?${params}`);
      if (!response.ok) throw new Error('Failed to fetch candidates');
      
      const data = await response.json();
      
      if (reset) {
        setCandidates(data.candidates);
      } else {
        setCandidates(prev => [...prev, ...data.candidates]);
      }
      
      setTotalCandidates(data.pagination.total);
      setHasNextPage(page < data.pagination.totalPages);
      setCurrentPage(page);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates(1, true);
  }, [searchTerm, stageFilter]);

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

  const isItemLoaded = (index) => !!candidates[index];

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // Handle stage change in kanban view
    if (viewMode === 'kanban') {
      const candidateId = active.id;
      const newStage = over.id;
      
      // Find the candidate and update optimistically
      const candidateIndex = candidates.findIndex(c => c.id === candidateId);
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
    const grouped = {};
    KANBAN_STAGES.forEach(stage => {
      grouped[stage.id] = candidates.filter(candidate => candidate.stage === stage.id);
    });
    return grouped;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && candidates.length === 0) {
    return (
      <div className="candidates-board">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading candidates...</p>
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
          <span className="search-icon">🔍</span>
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
          {candidates.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h3>No candidates found</h3>
              <p>Candidates will appear here as they apply for jobs</p>
            </div>
          ) : (
            <InfiniteLoader
              isItemLoaded={isItemLoaded}
              itemCount={hasNextPage ? candidates.length + 1 : candidates.length}
              loadMoreItems={loadMoreItems}
            >
              {({ onItemsRendered, ref }) => (
                <List
                  ref={ref}
                  height={600}
                  itemCount={candidates.length}
                  itemSize={ITEM_HEIGHT}
                  onItemsRendered={onItemsRendered}
                  className="candidates-virtual-list"
                >
                  {({ index, style }) => (
                    <div style={style}>
                      <CandidateListItem
                        candidate={candidates[index]}
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
