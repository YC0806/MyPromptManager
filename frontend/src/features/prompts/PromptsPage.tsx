import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { usePrompts } from "./hooks";
import { TagSelector } from "../../components/TagSelector";

export const PromptsPage = () => {
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  const { data: prompts = [], isLoading } = usePrompts(
    useMemo(
      () => ({
        search: search || undefined,
        tags__name: selectedTags.length ? selectedTags : undefined,
        is_archived: showArchived
      }),
      [search, selectedTags, showArchived]
    )
  );

  const activePrompts = prompts.filter(p => !p.is_archived);
  const archivedPrompts = prompts.filter(p => p.is_archived);

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>💬 Prompts</h1>
          <p style={{ color: "#6b7280", marginTop: "0.5rem" }}>
            Browse reusable prompts and manage their version history.
          </p>
        </div>
        <div className="action-bar">
          <Link to="/prompts/new" className="primary-button">
            ➕ New Prompt
          </Link>
          <button
            className="secondary-button"
            onClick={() => setShowArchived((state) => !state)}
          >
            {showArchived ? "👁️ Hide Archived" : "📦 Show Archived"}
          </button>
        </div>
      </div>

      {!isLoading && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem"
        }}>
          <div className="card" style={{ padding: "1.25rem", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💬</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#2563eb", marginBottom: "0.25rem" }}>
              {activePrompts.length}
            </div>
            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Active Prompts</div>
          </div>
          <div className="card" style={{ padding: "1.25rem", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📦</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#9ca3af", marginBottom: "0.25rem" }}>
              {archivedPrompts.length}
            </div>
            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Archived</div>
          </div>
          <div className="card" style={{ padding: "1.25rem", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📊</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#8b5cf6", marginBottom: "0.25rem" }}>
              {prompts.length}
            </div>
            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Total Prompts</div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ marginBottom: "1.25rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, color: "#374151" }}>
            🔍 Search
          </label>
          <input
            type="search"
            style={{ width: "100%" }}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or description..."
          />
        </div>
        <div>
          <h4 style={{ margin: "0 0 0.75rem", fontWeight: 600, color: "#374151" }}>
            🏷️ Filter by tags
          </h4>
          <TagSelector value={selectedTags} onChange={setSelectedTags} />
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Tags</th>
              <th>Versions</th>
              <th>Updated</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}>
                  <div className="loading" style={{ margin: "0 auto" }}></div>
                  <div style={{ marginTop: "1rem", color: "#6b7280" }}>Loading prompts...</div>
                </td>
              </tr>
            )}
            {!isLoading && prompts.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📭</div>
                  <div>No prompts found. Create your first prompt to get started!</div>
                </td>
              </tr>
            )}
            {prompts.map((prompt) => (
              <tr key={prompt.id}>
                <td>
                  <Link to={`/prompts/${prompt.id}`}>{prompt.name}</Link>
                </td>
                <td>
                  {prompt.tags.map((tag) => (
                    <span className="tag-pill" key={tag}>
                      {tag}
                    </span>
                  ))}
                </td>
                <td>
                  v{prompt.active_version?.version ?? "-"} / v
                  {prompt.latest_version?.version ?? "-"}
                </td>
                <td>{new Date(prompt.updated_at).toLocaleString()}</td>
                <td>{prompt.is_archived ? "Archived" : "Active"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
