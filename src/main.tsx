import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
const client = new QueryClient({
  defaultOptions: { queries: { retry: false, gcTime: 3600000 } },
});
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
