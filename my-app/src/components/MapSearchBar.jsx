import { useEffect, useRef, useState } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

const CATEGORY_COLORS = {
  food:          "#F97316",
  health:        "#EF4444",
  "legal-rights":"#8B5CF6",
  housing:       "#3B82F6",
  community:     "#10B981",
  transit:       "#06B6D4",
  work:          "#EAB308",
  banking:       "#6366F1",
  school:        "#EC4899",
  emergency:     "#DC2626",
};

export default function MapSearchBar({ onSelectResult }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}/resources/search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        const items = data.results ?? [];
        setResults(items);
        setOpen(items.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function handleSelect(resource) {
    setQuery(resource.name);
    setOpen(false);
    onSelectResult?.(resource);
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div className="map-search-container" ref={containerRef}>
      <div className="map-search">
        <span className="map-search-icon" aria-hidden>⌕</span>
        <input
          className="map-search-input"
          type="text"
          placeholder="Search services near you..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          aria-autocomplete="list"
          aria-expanded={open}
        />
        {loading && <span className="map-search-spinner" aria-hidden>⟳</span>}
        {query && (
          <button
            type="button"
            className="map-search-clear"
            onClick={handleClear}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <ul className="map-search-dropdown" role="listbox">
          {results.map((r) => (
            <li
              key={r.id}
              className="map-search-result"
              role="option"
              onClick={() => handleSelect(r)}
            >
              <span
                className="map-search-result-dot"
                style={{ background: CATEGORY_COLORS[r.category] ?? "#6B7280" }}
              />
              <div className="map-search-result-copy">
                <p className="map-search-result-name">{r.name}</p>
                {r.address && (
                  <p className="map-search-result-address">{r.address}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
