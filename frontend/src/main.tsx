import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <App />
        </ThemeProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--qa-modal, #0d0d1e)',
              border: '1px solid var(--qa-border, #222240)',
              color: 'var(--qa-text, #e2e8f0)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
