'use client';

// /src/components/SearchForm.js

import React, { useState } from 'react';

const SearchForm = () => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    setStatus('Searching...');
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });
    const data = await response.json();

    if (response.ok) {
      setResults(data.data);
      setStatus('Completed');
    } else {
      setStatus('Failed');
      alert(data.message || 'Error occurred');
    }
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter Twitter search query"
      />
      <button onClick={handleSearch}>Search</button>
      <div>Status: {status}</div>
      {results.length > 0 && (
        <div>
          <h2>Results:</h2>
          <ul>
            {results.map((tweet, index) => (
              <li key={index}>
                <strong>{tweet.username}</strong>: {tweet.text} <br />
                <small>{tweet.time}</small>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchForm;
