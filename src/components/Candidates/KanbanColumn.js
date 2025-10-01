import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';

const KanbanColumn = ({ stage, candidates, formatDate }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  // Ensure candidates is always an array
  const safeCandidates = Array.isArray(candidates) ? candidates : [];

  return (
    <div className="kanban-column">
      <div className="kanban-header" style={{ borderTopColor: stage.color }}>
        <div className="stage-info">
          <h3 className="stage-title">{stage.title}</h3>
          <span className="stage-count">({safeCandidates.length})</span>
        </div>
        <div 
          className="stage-indicator"
          style={{ backgroundColor: stage.color }}
        ></div>
      </div>
      
      <div 
        ref={setNodeRef}
        className={`kanban-content ${isOver ? 'drag-over' : ''}`}
      >
        <SortableContext items={safeCandidates.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {safeCandidates.length === 0 ? (
            <div className="kanban-empty">
              <span className="empty-text">No candidates</span>
            </div>
          ) : (
            safeCandidates.map(candidate => (
              <KanbanCard
                key={candidate.id}
                candidate={candidate}
                formatDate={formatDate}
                stageColor={stage.color}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
};

export default KanbanColumn;
