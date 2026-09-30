import React, { useState, useMemo, useRef, useEffect } from "react";
import { Copy, Check, Search, X, ChevronUp, ChevronDown } from "lucide-react";

interface RawJsonTabProps {
  rawJson: string;
  syntaxHighlighting?: boolean;
}

interface JsonToken {
  type: "key" | "string" | "number" | "boolean" | "null" | "punctuation" | "text";
  value: string;
}

// Tokenize a line of JSON into semantic tokens for syntax coloring
function tokenizeJsonLine(line: string): JsonToken[] {
  const tokens: JsonToken[] = [];
  const regex = /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b|\b(true|false)\b|\b(null)\b|([{}[\],:])|([^"0-9a-zA-Z{}[\],:]+)/g;
  let match: RegExpExecArray | null;
  let lastIndex = 0;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: "text",
        value: line.substring(lastIndex, match.index),
      });
    }

    const [full, str, colonAfter, num, bool, nil, punct] = match;

    if (str !== undefined) {
      if (colonAfter) {
        tokens.push({ type: "key", value: str });
        tokens.push({ type: "punctuation", value: colonAfter });
      } else {
        tokens.push({ type: "string", value: str });
      }
    } else if (num !== undefined) {
      tokens.push({ type: "number", value: num });
    } else if (bool !== undefined) {
      tokens.push({ type: "boolean", value: bool });
    } else if (nil !== undefined) {
      tokens.push({ type: "null", value: nil });
    } else if (punct !== undefined) {
      tokens.push({ type: "punctuation", value: punct });
    } else {
      tokens.push({ type: "text", value: full });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    tokens.push({
      type: "text",
      value: line.substring(lastIndex),
    });
  }

  return tokens;
}

export const RawJsonTab: React.FC<RawJsonTabProps> = ({
  rawJson,
  syntaxHighlighting = true,
}) => {
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

  // Helper to render text with search match marks inside a token
  const renderTextWithMatches = (text: string, keyPrefix: string, tokenType?: string) => {
    if (!escapedQuery) {
      if (tokenType && tokenType !== "text" && syntaxHighlighting) {
        return <span className={`token-${tokenType}`}>{text}</span>;
      }
      return text;
    }

    const parts = text.split(new RegExp(`(${escapedQuery})`, "gi"));
    return (
      <span className={syntaxHighlighting && tokenType && tokenType !== "text" ? `token-${tokenType}` : undefined}>
        {parts.map((part, pIdx) => {
          if (part.toLowerCase() === trimmedQuery.toLowerCase()) {
            matchCounter++;
            const isCurrent = matchCounter === currentMatchIdx;
            return (
              <mark
                key={`${keyPrefix}-${pIdx}`}
                ref={isCurrent ? activeMatchRef : undefined}
                className={`json-search-match ${isCurrent ? "current" : ""}`}
              >
                {part}
              </mark>
            );
          }
          return <React.Fragment key={`${keyPrefix}-${pIdx}`}>{part}</React.Fragment>;
        })}
      </span>
    );
  };

  return (
    <div className={`json-tab-container ${syntaxHighlighting ? "syntax-on" : "syntax-off"}`}>
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

      {/* JSON Code Viewer with Line Numbers and Multi-tone Syntax Highlighting */}
      <div className="json-viewer-body" ref={viewerBodyRef}>
        {lines.map((line, lineIdx) => {
          let lineContent: React.ReactNode;

          if (syntaxHighlighting) {
            const tokens = tokenizeJsonLine(line);
            lineContent = tokens.map((token, tIdx) => (
              <React.Fragment key={tIdx}>
                {renderTextWithMatches(token.value, `l${lineIdx}-t${tIdx}`, token.type)}
              </React.Fragment>
            ));
          } else {
            lineContent = renderTextWithMatches(line, `l${lineIdx}`);
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
