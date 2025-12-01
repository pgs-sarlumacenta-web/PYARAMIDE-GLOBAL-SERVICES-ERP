import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { DataProvider, AuthProvider } from './context/DataContext';
import { AlertProvider } from './context/AlertContext';
import { FabProvider } from './context/FabContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <AuthProvider>
          <DataProvider>
            <AlertProvider>
              <FabProvider>
                <App />
              </FabProvider>
            </AlertProvider>
          </DataProvider>
        </AuthProvider>
      </ThemeProvider>
    </HashRouter>
  </React.StrictMode>
);
