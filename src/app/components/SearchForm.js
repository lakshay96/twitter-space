'use client';

import { useState } from 'react';

function SearchForm() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState(null);
  const [tweets, setTweets] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setStatus('Searching...');

    const response = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();

    if (data.status === 'completed') {
      setTweets(data.tweets);
      setStatus('Completed');
    } else {
      setStatus('Failed');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          placeholder="Search Twitter"
        />
        <button type="submit">Search</button>
      </form>

      {status && <p>Status: {status}</p>}
      
      <div>
        {tweets.length > 0 && (
          <ul>
            {tweets.map((tweet, index) => (
              <li key={index}>
                <strong>{tweet.user}</strong>: {tweet.text}
                <br />
                <small>{tweet.time}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default SearchForm;
