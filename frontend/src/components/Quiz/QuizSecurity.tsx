import React, { useEffect, useRef, ReactNode } from 'react';

interface QuizSecurityProps {
  onViolation: () => void;
  children: ReactNode;
}

const QuizSecurity: React.FC<QuizSecurityProps> = ({ onViolation, children }) => {
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        onViolation();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [onViolation]);

  // Handle visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Start warning timeout when tab is hidden
        warningTimeoutRef.current = setTimeout(() => {
          onViolation();
        }, 5000); // 5 seconds warning
      } else {
        // Clear warning timeout when tab becomes visible
        if (warningTimeoutRef.current) {
          clearTimeout(warningTimeoutRef.current);
          warningTimeoutRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [onViolation]);

  // Enter fullscreen mode
  useEffect(() => {
    const enterFullscreen = async () => {
      if (fullscreenRef.current) {
        try {
          await fullscreenRef.current.requestFullscreen();
        } catch (err) {
          console.error('Error entering fullscreen:', err);
        }
      }
    };

    enterFullscreen();
  }, []);

  return (
    <div ref={fullscreenRef} className="w-full h-full">
      {children}
    </div>
  );
};

export default QuizSecurity; 