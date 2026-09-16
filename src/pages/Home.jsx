import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full text-center space-y-8">
        <h1 className="text-5xl md:text-6xl font-extrabold text-blue-600 tracking-tight">
          SignBridge
        </h1>
        
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800">
          An inclusive classroom where communication has no barriers.
        </h2>
        
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Connect hearing, Deaf, hard-of-hearing and non-speaking learners through speech, text and Indian Sign Language.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
          <Link 
            to="/classroom" 
            className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Enter Classroom
          </Link>
          <Link 
            to="/learn" 
            className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-xl font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl"
          >
            Start Learning ISL
          </Link>
        </div>

        <div className="mt-16 bg-white rounded-2xl p-8 shadow-md text-left">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">How SignBridge Works</h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h4 className="font-bold text-blue-800 mb-2">For Teachers</h4>
                <p className="text-gray-700 text-sm">
                  Teacher speaks <br/>
                  <span className="text-blue-500">→</span> Speech becomes text <br/>
                  <span className="text-blue-500">→</span> Text is converted into ISL visual signs
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-teal-50 p-4 rounded-xl border border-teal-100">
                <h4 className="font-bold text-teal-800 mb-2">For Students</h4>
                <p className="text-gray-700 text-sm">
                  Student signs <br/>
                  <span className="text-teal-500">→</span> Webcam detects ISL <br/>
                  <span className="text-teal-500">→</span> Sign becomes text <br/>
                  <span className="text-teal-500">→</span> Text can optionally be spoken aloud
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
