import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useTemplates } from "./hooks";
import { TagSelector } from "../../components/TagSelector";

export const TemplatesPage = () => {
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  const { data: templates = [], isLoading } = useTemplates(
    useMemo(
      () => ({
        search: search || undefined,
        tags__name: selectedTags.length ? selectedTags : undefined,
        is_archived: showArchived
      }),
      [search, selectedTags, showArchived]
    )
  );

  const activeTemplates = templates.filter(t => !t.is_archived);
  const archivedTemplates = templates.filter(t => t.is_archived);

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>📋 Prompt Templates</h1>
          <p style={{ color: "#6b7280", marginTop: "0.5rem" }}>
            Define reusable prompt blueprints with placeholders.
          </p>
        </div>
        <div className="action-bar">
          <Link to="/templates/new" className="primary-button">
            ➕ New Template
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
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📋</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#2563eb", marginBottom: "0.25rem" }}>
              {activeTemplates.length}
            </div>
            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Active Templates</div>
          </div>
          <div className="card" style={{ padding: "1.25rem", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📦</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#9ca3af", marginBottom: "0.25rem" }}>
              {archivedTemplates.length}
            </div>
            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Archived</div>
          </div>
          <div className="card" style={{ padding: "1.25rem", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📊</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#8b5cf6", marginBottom: "0.25rem" }}>
              {templates.length}
            </div>
            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Total Templates</div>
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
              <th>Placeholders</th>
              <th>Updated</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}>
                  <div className="loading" style={{ margin: "0 auto" }}></div>
                  <div style={{ marginTop: "1rem", color: "#6b7280" }}>Loading templates...</div>
                </td>
              </tr>
            )}
            {!isLoading && templates.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📭</div>
                  <div>No templates found. Create your first template to get started!</div>
                </td>
              </tr>
            )}
            {templates.map((template) => (
              <tr key={template.id}>
                <td>
                  <Link to={`/templates/${template.id}`}>{template.name}</Link>
                </td>
                <td>
                  {template.tags.map((tag) => (
                    <span className="tag-pill" key={tag}>
                      {tag}
                    </span>
                  ))}
                </td>
                <td>{template.latest_version?.placeholders.join(", ") ?? "—"}</td>
                <td>{new Date(template.updated_at).toLocaleString()}</td>
                <td>{template.is_archived ? "Archived" : "Active"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
