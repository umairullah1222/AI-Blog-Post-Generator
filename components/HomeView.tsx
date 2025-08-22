import React from 'react';
import { useAppContext } from '../contexts/AppContext.tsx';
import "../styles/HomeView.css"; // 👈 apni CSS file import karna na bhoolna
import "./HomeView.css";

const HomeView: React.FC = () => {
  const { currentUser, setActiveView, setIsAuthModalOpen } = useAppContext();
  
  const handleStartCreating = () => {
    if (currentUser) {
      setActiveView('posts');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-8 bg-slate-800/20 rounded-2xl border border-white/10 overflow-hidden animate-fade-in">
      <div className="max-w-4xl w-full flex flex-col md:flex-row items-center gap-8 md:gap-12">
        {/* Left side: Text content */}
        <div className="md:w-1/2 text-center md:text-left">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Welcome,{" "}
            <span className="bg-gradient-to-r from-purple-400 to-indigo-400 text-transparent bg-clip-text">
              {currentUser?.username || "Creator"}
            </span>
            !
          </h1>
          <p className="mt-4 text-lg text-slate-300 max-w-lg mx-auto md:mx-0">
            Unleash your creativity with the power of AI. Generate high-quality
            blog posts, research topics, and automate your content workflow, all
            in one place.
          </p>
          <div className="mt-8">
            <button
              onClick={handleStartCreating}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:opacity-90 transition-transform transform hover:scale-105"
            >
              Start Creating &rarr;
            </button>
          </div>
        </div>

        {/* Right side: Animated visual */}
        <div className="md:w-1/2 mt-8 md:mt-0 w-full h-64 md:h-80 flex items-center justify-center">
          <div className="relative w-full h-full">
            <div className="absolute w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full opacity-60 filter blur-sm float1"></div>
            <div className="absolute w-32 h-32 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full opacity-50 filter blur-md float2"></div>
            <div className="absolute w-16 h-16 bg-gradient-to-br from-fuchsia-500 to-pink-500 rounded-full opacity-70 filter blur-sm float3"></div>
            <div className="absolute w-20 h-20 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full opacity-40 filter blur-sm float4"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
