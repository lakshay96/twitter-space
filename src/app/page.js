import { useState } from 'react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState(null);
  const [results, setResults] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query }),
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    setStatus(data.status);
    setResults(data.results);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter Twitter Query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit">Submit</button>
      </form>
      {status && <p>Status: {status}</p>}
      {results && <div>{results.map((r) => <p key={r.id}>{r.text}</p>)}</div>}
    </div>
  );
}
