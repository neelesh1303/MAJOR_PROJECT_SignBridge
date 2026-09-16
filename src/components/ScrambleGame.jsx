import React, { useState, useEffect } from 'react';
import { loadDictionary } from '../utils/textToSigns';

function shuffleArray(array) {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

const ScrambleGame = () => {
  const [currentPhrase, setCurrentPhrase] = useState(null);
  const [scrambledWords, setScrambledWords] = useState([]);
  const [userAnswer, setUserAnswer] = useState([]);
  const [message, setMessage] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    loadDictionary().then(dict => {
      setData(dict);
      startGame(dict);
    });
  }, []);

  const startGame = (dict) => {
    // Need phrases with more than 1 word and a gif
    const playablePhrases = dict.filter(entry => (entry.gif || entry.image) && entry.word.trim().split(' ').length > 1);

    if (playablePhrases.length === 0) {
      setMessage('No playable phrases found.');
      setIsLoading(false);
      return;
    }

    const randomIndex = Math.floor(Math.random() * playablePhrases.length);
    const selectedPhrase = playablePhrases[randomIndex];

    setCurrentPhrase(selectedPhrase);
    const words = selectedPhrase.word.trim().split(' ');
    setScrambledWords(shuffleArray(words));
    setUserAnswer([]);
    setMessage('');
    setIsCorrect(false);
    setIsLoading(false);
  };

  const handleWordClick = (word, index) => {
    setUserAnswer(prev => [...prev, word]);
    const newScrambled = [...scrambledWords];
    newScrambled.splice(index, 1);
    setScrambledWords(newScrambled);
  };

  const checkAnswer = () => {
    if (!currentPhrase) return;
    const correctPhrase = currentPhrase.word.toLowerCase();
    const userPhrase = userAnswer.join(' ').toLowerCase();

    if (userPhrase === correctPhrase) {
      setMessage('✅ Correct! Well done!');
      setIsCorrect(true);
    } else {
      setMessage('❌ Try again. The order is incorrect.');
      setIsCorrect(false);
    }
  };

  const resetGame = () => {
    startGame(data);
  };

  const undoLast = () => {
    if (userAnswer.length === 0) return;
    const lastWord = userAnswer[userAnswer.length - 1];
    setUserAnswer(prev => prev.slice(0, -1));
    setScrambledWords(prev => [...prev, lastWord]);
    setMessage('');
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading game...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-2xl mx-auto text-center">
      <h2 className="text-3xl font-bold text-blue-600 mb-2">Caption Scramble</h2>
      <p className="text-gray-600 mb-8">Reorder the words to match the sign video.</p>

      {currentPhrase && (
        <div className="mb-8 flex justify-center">
          <img src={currentPhrase.gif || currentPhrase.image} alt="Sign language hint" className="h-64 object-contain rounded bg-gray-50 border border-gray-200 p-2" />
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Your Answer</h3>
        <div className="min-h-[60px] bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-wrap gap-2 justify-center items-center">
          {userAnswer.length === 0 && <span className="text-gray-400 italic">Click words below to arrange them</span>}
          {userAnswer.map((word, idx) => (
            <span key={idx} className="px-4 py-2 bg-blue-100 text-blue-800 font-bold rounded-lg cursor-pointer hover:bg-blue-200 transition">
              {word}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Word Bank</h3>
        <div className="flex flex-wrap gap-2 justify-center min-h-[50px]">
          {scrambledWords.map((word, index) => (
            <button
              key={index}
              onClick={() => handleWordClick(word, index)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100 shadow-sm transition"
            >
              {word}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 items-center">
        {message && (
          <div className={`font-bold text-lg ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
            {message}
          </div>
        )}
        
        <div className="flex gap-4">
          <button onClick={undoLast} disabled={userAnswer.length === 0} className="px-6 py-2 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 disabled:opacity-50 transition">
            Undo
          </button>
          {!isCorrect ? (
            <button onClick={checkAnswer} disabled={scrambledWords.length > 0} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition">
              Check Answer
            </button>
          ) : (
            <button onClick={resetGame} className="px-6 py-2 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition">
              Next Phrase
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScrambleGame;
