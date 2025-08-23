import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { FlowProvider } from './contexts/FlowContext';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { AuthCallback } from './pages/AuthCallback';
import './App.css';

// Lazy load the FlowBuilder for better initial load performance
const FlowBuilder = React.lazy(() => 
  import('./features/flow/components/FlowBuilder').then(module => ({ 
    default: module.FlowBuilder 
  }))
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Auth callback route */}
            <Route path="/auth/callback" element={<AuthCallback />} />
            
            {/* Main application route */}
            <Route 
              path="/*" 
              element={
                <FlowProvider>
                  <div className="fixed inset-0 w-screen h-screen overflow-hidden">
                    <Suspense 
                      fallback={
                        <div className="fixed inset-0 flex items-center justify-center bg-white">
                          <LoadingSpinner 
                            size="lg" 
                            message="Loading Flow Builder..."
                          />
                        </div>
                      }
                    >
                      <FlowBuilder />
                    </Suspense>
                  </div>
                </FlowProvider>
              } 
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;