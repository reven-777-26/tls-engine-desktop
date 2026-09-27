import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface RawJsonTabProps {
  rawJson: string;
}

export const RawJsonTab: React.FC<RawJsonTabProps> = ({ rawJson }) => {
  const [copied, setCopied] = useState(false);

  // Prettify if needed
  let formattedJson = rawJson;
  try {
    const parsed = JSON.parse(rawJson);
    formattedJson = JSON.stringify(parsed, null, 2);
  } catch {
    // Keep raw
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="json-viewer-wrap">
      <button className="json-copy-btn" onClick={handleCopy} title="Copy entire JSON payload">
        {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
        <span>{copied ? "Copied!" : "Copy Raw JSON"}</span>
      </button>

      <pre className="code-block">{formattedJson}</pre>
    </div>
  );
};
