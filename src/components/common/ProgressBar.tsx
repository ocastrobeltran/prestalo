import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, color = 'var(--success)' }) => {
  const percentage = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="progress-container">
      <div 
        className="progress-bar" 
        style={{ 
          width: `${percentage}%`,
          backgroundColor: color
        }}
      />
      <style>{`
        .progress-container {
          width: 100%;
          height: 6px;
          background-color: var(--border-color);
          border-radius: 9999px;
          overflow: hidden;
          transition: background-color 0.3s;
        }

        .progress-bar {
          height: 100%;
          border-radius: 9999px;
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
};
