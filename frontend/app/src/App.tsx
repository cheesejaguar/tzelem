import { useState } from 'react';
import { FlowBuilder } from './features/flow/components/FlowBuilder';
import { Header } from './components/layout/Header';

function App() {
  const [activeView, setActiveView] = useState<'flow' | 'run' | 'secrets'>('flow');

  return (
    <div className="min-h-screen bg-background">
      <Header activeView={activeView} onViewChange={setActiveView} />
      
      <main className="flex-1">
        {activeView === 'flow' && <FlowBuilder />}
        {activeView === 'run' && (
          <div className="container py-8">
            <div className="text-center py-16">
              <h2 className="display-medium mb-4">Run Console</h2>
              <p className="body-large text-muted-foreground">Coming soon...</p>
            </div>
          </div>
        )}
        {activeView === 'secrets' && (
          <div className="container py-8">
            <div className="text-center py-16">
              <h2 className="display-medium mb-4">Secrets Manager</h2>
              <p className="body-large text-muted-foreground">Coming soon...</p>
            </div>
          </div>
        )}
      </main>


    </div>
  );
}

export default App;
