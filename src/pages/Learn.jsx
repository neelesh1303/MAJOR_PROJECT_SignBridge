import React, { useEffect, useState } from 'react';
import { loadDictionary } from '../utils/textToSigns';

const Learn = () => {
  const [dictionary, setDictionary] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDict = async () => {
      const data = await loadDictionary();
      setDictionary(data);
      setLoading(false);
    };
    fetchDict();
  }, []);

  const filtered = dictionary.filter(entry => 
    entry.word.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (entry.examples && entry.examples.some(ex => ex.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Learn Indian Sign Language</h1>
        <p className="text-xl text-gray-600">Browse our dictionary of commonly used signs.</p>
        
        <div className="mt-8 max-w-xl mx-auto relative">
          <input 
            type="text" 
            placeholder="Search signs, phrases, examples..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-6 py-4 rounded-full border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500 text-lg">Loading dictionary...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.length > 0 ? (
            filtered.map((entry, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                <div className="h-48 bg-gray-50 p-4 flex items-center justify-center border-b border-gray-100">
                  {entry.gif || entry.image ? (
                    <img 
                      src={entry.gif || entry.image} 
                      alt={entry.word} 
                      className="max-h-full max-w-full object-contain rounded"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-gray-400 italic">No visual available</span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 uppercase">{entry.word}</h3>
                  {entry.examples && entry.examples.length > 0 && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      <span className="font-semibold text-gray-700">Example:</span> {entry.examples[0]}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 text-gray-500 text-lg">
              No signs found for "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Learn;
