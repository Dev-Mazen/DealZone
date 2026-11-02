import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LangProvider } from './context/LangContext';
import AppRouter from './router/index';
import './i18n/index';          // initialise i18next (must run before render)
import './index.css';
import './styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 min
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <LangProvider>
            <AppRouter />
          </LangProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);
