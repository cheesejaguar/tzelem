import React from 'react';
import { Background, BackgroundVariant } from '@xyflow/react';

interface FlowCanvasProps {
  children: React.ReactNode;
}

export function FlowCanvas({ children }: FlowCanvasProps) {
  return (
    <div className="w-full h-full">
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1}
        color="var(--border-secondary)"
        className="opacity-50"
      />
      {children}
    </div>
  );
}