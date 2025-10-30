import { useState } from "react";

import type { PromptVersion } from "../../../types/models";

interface PromptVersionTimelineProps {
  versions: PromptVersion[];
  onRestore: (version: PromptVersion, changelog?: string) => void;
  isRestoring?: boolean;
}

export const PromptVersionTimeline = ({
  versions,
  onRestore,
  isRestoring
}: PromptVersionTimelineProps) => {
  const [selected, setSelected] = useState<PromptVersion | null>(null);
  const [changelog, setChangelog] = useState("");

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Version History</h2>
      {versions.length === 0 ? (
        <p>No versions yet.</p>
      ) : (
        <div className="grid grid--two-equal" style={{ marginTop: "1rem" }}>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {versions.map((version) => (
              <li key={version.id} style={{ marginBottom: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setSelected(version)}
                  className="secondary-button"
                  style={{
                    width: "100%",
                    justifyContent: "space-between",
                    display: "flex"
                  }}
                >
                  <span>v{version.version}</span>
                  <span>{new Date(version.created_at).toLocaleString()}</span>
                </button>
              </li>
            ))}
          </ul>
          {selected ? (
            <div>
              <h3 style={{ marginTop: 0 }}>v{selected.version} preview</h3>
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  background: "#0f172a",
                  color: "#f3f4f6",
                  padding: "1rem",
                  borderRadius: "0.75rem",
                  maxHeight: 320,
                  overflow: "auto"
                }}
              >
                {selected.content}
              </pre>
              <p>
                <strong>Changelog:</strong> {selected.changelog ?? "n/a"}
              </p>
              <label>
                <span>Restore with note (optional)</span>
                <input
                  type="text"
                  value={changelog}
                  onChange={(event) => setChangelog(event.target.value)}
                  style={{ width: "100%", marginTop: "0.5rem" }}
                  placeholder="Reason for restore"
                />
              </label>
              <button
                className="primary-button"
                style={{ marginTop: "1rem" }}
                type="button"
                onClick={() => onRestore(selected, changelog)}
                disabled={isRestoring}
              >
                Restore this version
              </button>
            </div>
          ) : (
            <p>Select a version to inspect content.</p>
          )}
        </div>
      )}
    </div>
  );
};
