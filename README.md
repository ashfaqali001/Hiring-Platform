# TalentFlow - HR Management Platform

A modern React-based hiring platform for HR teams to manage jobs, candidates, and assessments.

## 🚀 Features

### Jobs Management
- Jobs board with pagination, filtering, and search
- Drag & drop reordering with optimistic updates
- CRUD operations (create, edit, archive, delete)
- Deep linking to individual jobs

### Candidates Management  
- Virtualized list handling 1000+ candidates
- Client-side search and filtering
- Kanban board with drag & drop stage management
- Candidate profiles with timeline

### Assessments System
- Assessment builder with multiple question types
- Live preview and conditional logic
- Form validation and response management

## 🏗️ Tech Stack

- **React 18** with JavaScript
- **React Router** for navigation
- **@dnd-kit** for drag & drop
- **react-window** for virtualization
- **MSW** for API simulation
- **Dexie** for IndexedDB persistence
- **CSS3** with modern styling

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## 📋 Key Implementation Details

### API Simulation
- MSW intercepts API calls with 200-1200ms latency
- 5-10% error rate on write operations
- RESTful endpoints with pagination

### Data Persistence
- All data stored in IndexedDB via Dexie
- Auto-seeded with 25 jobs, 1000 candidates, 3+ assessments
- Proper relational data structure

### Performance Features
- Virtualized lists for large datasets
- Optimistic updates with rollback
- Debounced search and filtering
- Responsive design for all devices

## 🎯 Core Flows Implemented

1. **Jobs Board**: List → Filter → Create/Edit → Reorder → Deep Link
2. **Candidates**: List → Search → Kanban → Profile → Stage Management  
3. **Assessments**: Builder → Preview → Form Runtime → Validation

## 📱 Responsive Design

Fully responsive across desktop, tablet, and mobile with:
- Touch-friendly interactions
- Optimized layouts for different screen sizes
- Accessible keyboard navigation

## 🚀 Deployment

Works entirely in the browser with no backend dependencies. Deploy the build folder to any static hosting service.

---

Built with modern React best practices and performance optimizations.