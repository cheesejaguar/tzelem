import { Workflow, Play, Key } from 'lucide-react';
import { Button } from '../ui/button';

interface HeaderProps {
  activeView: 'flow' | 'run' | 'secrets';
  onViewChange: (view: 'flow' | 'run' | 'secrets') => void;
  onExportFlow?: () => void;
  onStartRun?: () => void;
}

export function Header({ activeView, onViewChange, onExportFlow, onStartRun }: HeaderProps) {
  return (
    <header className="header">
      <div className="container">
        <nav className="nav">
          <div className="nav-logo">
            <Workflow className="icon-large" />
            <span>Tzelem</span>
          </div>
          
          <div className="nav-links">
            <Button
              variant={activeView === 'flow' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('flow')}
              className="gap-2"
            >
              <Workflow className="icon-small" />
              Flow Builder
            </Button>
            
            <Button
              variant={activeView === 'run' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('run')}
              className="gap-2"
            >
              <Play className="icon-small" />
              Run Console
            </Button>
            
            <Button
              variant={activeView === 'secrets' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('secrets')}
              className="gap-2"
            >
              <Key className="icon-small" />
              Secrets
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={onExportFlow}>
              Export Flow
            </Button>
            <Button size="sm" className="btn-primary" onClick={onStartRun}>
              Start Run
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
} 