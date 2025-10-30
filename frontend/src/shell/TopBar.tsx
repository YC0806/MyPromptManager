import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useGlobalSearch } from "../hooks/useGlobalSearch";

export const TopBar = () => {
  const [query, setQuery] = useState("");
  const { results, isLoading, reset } = useGlobalSearch(query);
  const navigate = useNavigate();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (results.length === 0) {
      return;
    }
    const first = results[0];
    navigate(first.to);
    reset();
    setQuery("");
  };

  return (
    <header className="topbar">
      <form className="topbar__search" onSubmit={handleSubmit}>
        <input
          type="search"
          placeholder="Search prompts or templates…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button type="submit" disabled={isLoading}>
          Search
        </button>
      </form>
      {results.length > 0 && (
        <div className="topbar__search-results">
          <ul>
            {results.map((item) => (
              <li key={item.to}>
                <button
                  type="button"
                  onClick={() => {
                    navigate(item.to);
                    reset();
                    setQuery("");
                  }}
                >
                  <span className="topbar__search-title">{item.label}</span>
                  <span className="topbar__search-meta">{item.meta}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="topbar__profile">You</div>
    </header>
  );
};
