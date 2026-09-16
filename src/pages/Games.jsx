import React, { useState } from 'react';
import Quiz from '../components/Quiz';
import ScrambleGame from '../components/ScrambleGame';

const Games = () => {
  const [activeGame, setActiveGame] = useState('hub');

  if (activeGame === 'quiz') {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 p-4 pt-8">
        <button onClick={() => setActiveGame('hub')} className="mb-4 text-blue-600 font-semibold hover:underline">← Back to Games</button>
        <Quiz />
      </div>
    );
  }

  if (activeGame === 'scramble') {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 p-4 pt-8">
        <button onClick={() => setActiveGame('hub')} className="mb-4 text-blue-600 font-semibold hover:underline">← Back to Games</button>
        <ScrambleGame />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex flex-col items-center py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-blue-600 mb-4">ISL Games</h1>
        <p className="text-xl text-gray-600">Practice Indian Sign Language in a fun and interactive way.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
        <div 
          onClick={() => setActiveGame('quiz')}
          className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer text-center group"
        >
          <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">ISL Quiz</h2>
          <p className="text-gray-600">Test your knowledge by identifying signs.</p>
        </div>

        <div 
          onClick={() => setActiveGame('scramble')}
          className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer text-center group"
        >
          <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Caption Scramble</h2>
          <p className="text-gray-600">Reorder English words to match an ISL phrase.</p>
        </div>
      </div>
    </div>
  );
};

export default Games;
