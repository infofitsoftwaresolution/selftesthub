import React from 'react';

const PageLoader: React.FC = () => {
  return (
    <div className="flex flex-col justify-center items-center h-[60vh] min-h-[300px] w-full gap-4">
      {/* Outer spinning ring with gradient */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-t-4 border-blue-600 animate-spin opacity-80" />
        <div className="absolute inset-2 rounded-full border-r-4 border-indigo-500 animate-spin-slow opacity-60" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        <div className="absolute inset-4 rounded-full border-b-4 border-teal-400 animate-pulse opacity-90" />
      </div>
      
      {/* Loading text with animated dots */}
      <div className="text-zinc-600 font-medium tracking-wide flex items-center justify-center">
        Loading<span className="animate-[bounce_1.4s_infinite] mx-[1px]">.</span><span className="animate-[bounce_1.4s_0.2s_infinite] mx-[1px]">.</span><span className="animate-[bounce_1.4s_0.4s_infinite] mx-[1px]">.</span>
      </div>
      
      {/* Optional progress bar line at the bottom */}
      <div className="w-48 h-1 bg-gray-200 rounded-full mt-2 overflow-hidden shadow-inner">
        <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-teal-400 w-full animate-progress rounded-full scale-x-0 origin-left" style={{ animation: 'shimmer 2s infinite ease-in-out' }} />
      </div>
      
      <style>
        {`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-spin-slow {
            animation: spin 3s linear infinite;
          }
        `}
      </style>
    </div>
  );
};

export default PageLoader;
