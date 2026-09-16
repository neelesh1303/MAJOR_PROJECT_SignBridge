import React, { useState, useEffect } from "react";
import { loadDictionary } from '../utils/textToSigns';

export default function Quiz() {
  const [data, setData] = useState([]);
  const [question, setQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [answer, setAnswer] = useState(null);
  const [chosen, setChosen] = useState(null);
  const [score, setScore] = useState(0);
  const [attempted, setAttempted] = useState(0);

  useEffect(() => {
    loadDictionary().then(dict => {
      const valid = dict.filter(d => d.gif || d.image);
      setData(valid);
      generateQuestion(valid);
    });
  }, []);

  const generateQuestion = (dictData = data) => {
    if (dictData.length < 4) return;

    const entry = dictData[Math.floor(Math.random() * dictData.length)];
    const correctWord = entry.word;

    let wrongOptions = dictData
      .filter((d) => d.word !== correctWord)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map((d) => d.word);

    let allOptions = [...wrongOptions, correctWord].sort(
      () => 0.5 - Math.random()
    );

    setQuestion(entry);
    setOptions(allOptions);
    setAnswer(null);
    setChosen(null);
  };

  const handleAnswer = (opt) => {
    if (answer) return;
    setChosen(opt);
    const isCorrect = opt === question.word;
    setAnswer(isCorrect ? "correct" : "wrong");
    setAttempted((prev) => prev + 1);
    if (isCorrect) setScore((prev) => prev + 1);
  };

  if (!question) return <div className="p-8 text-center text-gray-500">Loading quiz...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-2xl mx-auto text-center">
      <h2 className="text-3xl font-bold text-teal-600 mb-2">ISL Quiz</h2>
      <p className="text-gray-600 mb-6">What does this sign mean?</p>

      <div className="flex justify-between items-center mb-6 px-4 bg-gray-50 rounded-lg py-2">
        <span className="font-semibold text-gray-700">Score: {score}</span>
        <span className="font-semibold text-gray-700">Attempted: {attempted}</span>
      </div>

      <div className="mb-8 flex justify-center">
        <img 
          src={question.gif || question.image} 
          alt="Sign" 
          className="h-64 object-contain rounded bg-gray-50 border border-gray-200 p-2" 
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {options.map((opt, i) => {
          let btnClass = "bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50";
          if (answer) {
            if (opt === question.word) btnClass = "bg-green-100 border-green-500 text-green-800";
            else if (opt === chosen && opt !== question.word) btnClass = "bg-red-100 border-red-500 text-red-800";
            else btnClass = "bg-gray-100 border-gray-200 text-gray-400 opacity-50";
          }

          return (
            <button
              key={i}
              onClick={() => handleAnswer(opt)}
              disabled={!!answer}
              className={`p-4 rounded-xl font-bold text-lg transition ${btnClass}`}
            >
              {opt.toUpperCase()}
            </button>
          );
        })}
      </div>

      {answer && (
        <button 
          onClick={() => generateQuestion(data)}
          className="px-8 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition shadow-sm"
        >
          Next Question
        </button>
      )}
    </div>
  );
}