// Custom HMR client to suppress WebSocket connection errors
if (typeof window !== 'undefined' && import.meta.hot) {
  // Override WebSocket constructor to suppress connection errors
  const OriginalWebSocket = window.WebSocket;
  
  window.WebSocket = class extends OriginalWebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
      super(url, protocols);
      
      // Suppress WebSocket connection errors for HMR
      this.addEventListener('error', (event) => {
        if (url.toString().includes('localhost:5173') || url.toString().includes('ws://')) {
          event.stopPropagation();
          event.preventDefault();
          return false;
        }
      });
      
      this.addEventListener('close', (_event) => {
        if (url.toString().includes('localhost:5173') || url.toString().includes('ws://')) {
          // Don't log WebSocket close events for HMR
          return;
        }
      });
    }
  } as any;
  
  // Override the HMR client's retry logic to reduce noise
  const originalSetTimeout = window.setTimeout;
  window.setTimeout = ((fn: Function, delay: number, ...args: any[]) => {
    // Reduce HMR reconnection frequency to minimize console noise
    if (fn.toString().includes('connect') && delay < 5000) {
      delay = 5000; // Increase delay between reconnection attempts
    }
    return originalSetTimeout(fn, delay, ...args);
  }) as any;
}

export {};
