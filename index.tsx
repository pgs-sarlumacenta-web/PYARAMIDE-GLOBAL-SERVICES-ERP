import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.tsx';
import { DataProvider, AuthProvider } from './context/DataContext.tsx';
import { AlertProvider } from './context/AlertContext.tsx';
import { FabProvider } from './context/FabContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HashRouter>
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