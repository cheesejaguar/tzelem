import { useHotkeys } from 'react-hotkeys-hook';
import { useFlow } from '@/contexts/FlowContext';

export function useKeyboardShortcuts() {
  const { state, dispatch } = useFlow();

  // Undo/Redo shortcuts
  useHotkeys('cmd+z, ctrl+z', (event) => {
    event.preventDefault();
    if (state.historyIndex > 0) {
      dispatch({ type: 'UNDO' });
    }
  }, { enableOnContentEditable: false });

  useHotkeys('cmd+shift+z, ctrl+y', (event) => {
    event.preventDefault();
    if (state.historyIndex < state.history.length - 1) {
      dispatch({ type: 'REDO' });
    }
  }, { enableOnContentEditable: false });

  // Delete selected node/edge
  useHotkeys('delete, backspace', (event) => {
    if (document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA') {
      return; // Don't interfere with input fields
    }
    
    event.preventDefault();
    if (state.selectedNode) {
      dispatch({ type: 'DELETE_NODE', payload: state.selectedNode });
    } else if (state.selectedEdge) {
      dispatch({ type: 'DELETE_EDGE', payload: state.selectedEdge });
    }
  }, { enableOnContentEditable: false });

  // Select all
  useHotkeys('cmd+a, ctrl+a', (event) => {
    if (document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA') {
      return;
    }
    event.preventDefault();
    // Could implement select all nodes functionality
  }, { enableOnContentEditable: false });

  // Escape to deselect
  useHotkeys('escape', (event) => {
    event.preventDefault();
    dispatch({ type: 'SELECT_NODE', payload: null });
    dispatch({ type: 'SELECT_EDGE', payload: null });
  }, { enableOnContentEditable: false });

  // Focus search/command palette (future feature)
  useHotkeys('cmd+k, ctrl+k', (event) => {
    event.preventDefault();
    // Could open command palette
    console.log('Command palette shortcut (not implemented)');
  }, { enableOnContentEditable: false });

  // Export flow
  useHotkeys('cmd+e, ctrl+e', (event) => {
    event.preventDefault();
    if (state.nodes.length > 0) {
      // Dispatch export action
      console.log('Export shortcut triggered');
    }
  }, { enableOnContentEditable: false });

  // Show help
  useHotkeys('?, cmd+/', (event) => {
    event.preventDefault();
    console.log('Help shortcut (could show keyboard shortcuts modal)');
  }, { enableOnContentEditable: false });

  return {
    // Return any helper functions if needed
    canUndo: state.historyIndex > 0,
    canRedo: state.historyIndex < state.history.length - 1,
  };
}

// Keyboard shortcuts reference for help modal
export const keyboardShortcuts = [
  { keys: ['⌘Z', 'Ctrl+Z'], description: 'Undo last action' },
  { keys: ['⌘⇧Z', 'Ctrl+Y'], description: 'Redo last action' },
  { keys: ['Delete', 'Backspace'], description: 'Delete selected node/edge' },
  { keys: ['Escape'], description: 'Deselect all' },
  { keys: ['⌘K', 'Ctrl+K'], description: 'Open command palette' },
  { keys: ['⌘E', 'Ctrl+E'], description: 'Export flow' },
  { keys: ['?', '⌘/'], description: 'Show keyboard shortcuts' },
] as const;