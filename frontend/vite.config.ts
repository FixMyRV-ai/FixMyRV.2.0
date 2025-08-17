import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Suppress React DevTools warnings in development and production
    __REACT_DEVTOOLS_GLOBAL_HOOK__: JSON.stringify({ isDisabled: true }),
    // Suppress other common development warnings
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  server: {
    // Suppress dev server warnings and noise
    hmr: {
      overlay: false,
      clientPort: 5173,
      port: 5173
    },
    // Suppress HTTPS/certificate warnings
    cors: true,
    // Reduce logging noise
    middlewareMode: false
  },
  build: {
    // Suppress build warnings
    rollupOptions: {
      onwarn: (warning, warn) => {
        // Suppress specific warnings during build
        if (warning.code === 'THIS_IS_UNDEFINED' || 
            warning.code === 'CIRCULAR_DEPENDENCY' ||
            warning.message.includes('Use of eval')) {
          return;
        }
        warn(warning);
      }
    }
  },
  // Global suppression of console noise in development
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    legalComments: 'none'
  },
  // Suppress Vite client logs
  logLevel: 'error',
  clearScreen: false
})
