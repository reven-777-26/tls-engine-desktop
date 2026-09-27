import React, { useState, useMemo, useRef, useEffect } from "react";
import { Copy, Check, Search, X, ChevronUp, ChevronDown } from "lucide-react";

interface RawJsonTabProps {
  rawJson: string;
}

export const RawJsonTab: React.FC<RawJsonTabProps> = ({ rawJson }) => {
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const activeMatchRef = useRef<HTMLElement>(null);
  const viewerBodyRef = useRef<HTMLDivElement>(null);

  // Prettify JSON if valid
  const formattedJson = useMemo(() => {
    try {
      const parsed = JSON.parse(rawJson);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return rawJson || "";
    }
  }, [rawJson]);

  const lines = useMemo(() => formattedJson.split("\n"), [formattedJson]);

  const trimmedQuery = searchQuery.trim();
  const escapedQuery = useMemo(() => {
    if (!trimmedQuery) return null;
    return trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }, [trimmedQuery]);

  // Calculate total number of matches
  const totalMatches = useMemo(() => {
    if (!escapedQuery) return 0;
    try {
      const regex = new RegExp(escapedQuery, "gi");
      const matches = formattedJson.match(regex);
      return matches ? matches.length : 0;
    } catch {
      return 0;
    }
  }, [formattedJson, escapedQuery]);

  // Keep current match index in valid range
  useEffect(() => {
    if (totalMatches > 0) {
      setCurrentMatchIdx((prev) => (prev >= totalMatches ? 0 : prev));
    } else {
      setCurrentMatchIdx(0);
    }
  }, [totalMatches]);

  // Auto-scroll to active match
  useEffect(() => {
    if (totalMatches > 0 && activeMatchRef.current) {
      activeMatchRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentMatchIdx, totalMatches]);

  // Keyboard shortcut: Cmd+F / Ctrl+F focuses search input
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentMatchIdx(0);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setCurrentMatchIdx(0);
    searchInputRef.current?.focus();
  };

  const goToNextMatch = () => {
    if (totalMatches === 0) return;
    setCurrentMatchIdx((prev) => (prev + 1) % totalMatches);
  };

  const goToPrevMatch = () => {
    if (totalMatches === 0) return;
    setCurrentMatchIdx((prev) => (prev - 1 + totalMatches) % totalMatches);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        goToPrevMatch();
      } else {
        goToNextMatch();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleClearSearch();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Track match counter during render pass to highlight active match
  let matchCounter = -1;

  return (
    <div className="json-tab-container">
      {/* Search & Actions Toolbar */}
      <div className="json-toolbar">
        <div className="json-search-wrap">
          <Search size={14} className="json-search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            className="json-search-input"
            placeholder="Search JSON (keys, values)..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          {trimmedQuery && (
            <>
              <span className="json-match-count">
                {totalMatches === 0
                  ? "0 matches"
                  : `${currentMatchIdx + 1} of ${totalMatches}`}
              </span>

              <div className="json-nav-btns">
                <button
                  type="button"
                  className="json-nav-btn"
                  onClick={goToPrevMatch}
                  disabled={totalMatches === 0}
                  title="Previous match (Shift+Enter)"
                  aria-label="Previous match"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  className="json-nav-btn"
                  onClick={goToNextMatch}
                  disabled={totalMatches === 0}
                  title="Next match (Enter)"
                  aria-label="Next match"
                >
                  <ChevronDown size={14} />
                </button>
              </div>

              <button
                type="button"
                className="json-clear-btn"
                onClick={handleClearSearch}
                title="Clear search (Esc)"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          className="json-copy-btn"
          onClick={handleCopy}
          title="Copy entire JSON payload"
        >
          {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
          <span>{copied ? "Copied!" : "Copy JSON"}</span>
        </button>
      </div>

      {/* JSON Code Viewer with Line Numbers and Match Highlights */}
      <div className="json-viewer-body" ref={viewerBodyRef}>
        {lines.map((line, lineIdx) => {
          let lineContent: React.ReactNode = line;

          if (escapedQuery) {
            const parts = line.split(new RegExp(`(${escapedQuery})`, "gi"));
            lineContent = parts.map((part, pIdx) => {
              if (part.toLowerCase() === trimmedQuery.toLowerCase()) {
                matchCounter++;
                const isCurrent = matchCounter === currentMatchIdx;
                return (
                  <mark
                    key={pIdx}
                    ref={isCurrent ? activeMatchRef : undefined}
                    className={`json-search-match ${isCurrent ? "current" : ""}`}
                  >
                    {part}
                  </mark>
                );
              }
              return <React.Fragment key={pIdx}>{part}</React.Fragment>;
            });
          }

          return (
            <div className="json-line" key={lineIdx}>
              <span className="json-line-num">{lineIdx + 1}</span>
              <span className="json-line-content">{lineContent}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
