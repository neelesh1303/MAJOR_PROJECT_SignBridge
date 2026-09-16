import React from 'react';

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-blue-600 mb-4">About SignBridge</h1>
          <p className="text-xl text-gray-600">Building bridges in education through Indian Sign Language.</p>
        </div>

        <section className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Problem</h2>
          <p className="text-gray-700 leading-relaxed">
            Traditional classrooms can create communication barriers for Deaf and hard-of-hearing students. 
            When teachers speak, non-hearing students may miss critical information, and when non-speaking 
            students try to communicate, hearing peers and teachers may not understand their signs.
          </p>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Solution</h2>
          <p className="text-gray-700 leading-relaxed">
            SignBridge provides speech-to-text, text-to-sign and sign-to-text assistance inside a common 
            classroom environment. By using a controlled-vocabulary ISL assistive communication platform, 
            everyone can participate seamlessly.
          </p>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Technology</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-700 mb-2">Frontend</h3>
              <p className="text-gray-600 text-sm">React + Vite + Tailwind</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-teal-700 mb-2">AI / Machine Learning</h3>
              <p className="text-gray-600 text-sm">MediaPipe + OpenCV + scikit-learn</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-700 mb-2">Browser APIs</h3>
              <p className="text-gray-600 text-sm">Web Speech API + Speech Synthesis</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-700 mb-2">Backend</h3>
              <p className="text-gray-600 text-sm">Python + FastAPI</p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Future Scope</h2>
          <ul className="grid sm:grid-cols-2 gap-3 text-gray-700">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div> Larger ISL dataset
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div> Continuous sentence recognition
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div> Facial-expression recognition
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div> Better temporal models
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div> Multilingual speech
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div> Teacher/student classroom accounts
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div> Progress tracking
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div> Real-time collaborative classroom
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div> Mobile application
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default About;
