import { setupWorker } from 'msw/browser';
import { handlers } from './handlers.js';

// Setup MSW worker for browser environment
export const worker = setupWorker(...handlers);
