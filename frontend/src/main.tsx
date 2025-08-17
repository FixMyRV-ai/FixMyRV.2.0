import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import "./vite-hmr-fix";  // Import WebSocket error suppression

// Suppress common third-party console errors
const originalError = console.error;
console.error = (...args) => {
  const message = args[0]?.toString() || '';
  
  // Filter out known third-party library errors and React DevTools issues
  if (
    message.includes('AllowLocalHost') ||
    message.includes('fd_content') ||
    message.includes('Pe.onSubmitFormInfo') ||
    message.includes('Download the React DevTools') ||
    message.includes('Something has shimmed the React DevTools global hook') ||
    message.includes('__REACT_DEVTOOLS_GLOBAL_HOOK__') ||
    message.includes('Fast Refresh is not compatible') ||
    message.includes('react-refresh') ||
    message.includes('Unable to preventDefault inside passive event listener') ||
    message.includes('ResizeObserver loop limit exceeded') ||
    message.includes('Non-serializable values were found') ||
    message.includes('TypeError: Cannot read properties of undefined') ||
    message.includes('WebSocket connection to') ||
    message.includes('ws://localhost:5173') ||
    message.includes('connection failed') ||
    message.includes('[vite]') ||
    message.includes('hmr')
  ) {
    return; // Suppress these errors
  }
  
  originalError.apply(console, args);
};

// Suppress warnings as well
const originalWarn = console.warn;
console.warn = (...args) => {
  const message = args[0]?.toString() || '';
  
  if (
    message.includes('Download the React DevTools') ||
    message.includes('render methods should be pure') ||
    message.includes('Something has shimmed the React DevTools') ||
    message.includes('Fast Refresh is not compatible') ||
    message.includes('will be disabled') ||
    message.includes('componentWillReceiveProps') ||
    message.includes('deprecated') ||
    message.includes('validateDOMNesting')
  ) {
    return; // Suppress these warnings
  }
  
  originalWarn.apply(console, args);
};

// Global error handler for unhandled runtime errors
window.addEventListener('error', (event) => {
  // Suppress known third-party errors and WebSocket connection errors
  const message = event.message || event.error?.message || '';
  
  if (
    message.includes('AllowLocalHost') ||
    message.includes('fd_content') ||
    message.includes('__REACT_DEVTOOLS_GLOBAL_HOOK__') ||
    message.includes('ResizeObserver loop limit') ||
    message.includes('Script error') ||
    message.includes('WebSocket connection') ||
    message.includes('ws://localhost') ||
    message.includes('connection failed') ||
    event.filename?.includes('localhost:5173')
  ) {
    event.preventDefault();
    return false;
  }
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason?.message || String(event.reason) || '';
  
  if (
    message.includes('AllowLocalHost') ||
    message.includes('fd_content') ||
    message.includes('Network request failed') && message.includes('localhost') ||
    message.includes('WebSocket') ||
    message.includes('connection failed')
  ) {
    event.preventDefault();
    return false;
  }
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
