import { FormEvent, useState } from "react";

import { useCreateTag, useDeleteTag, useTags } from "./hooks";

export const TagsPage = () => {
  const { data: tags = [], isLoading } = useTags();
  const createTag = useCreateTag();
  const deleteTag = useDeleteTag();
  const [name, setName] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }
    createTag.mutate(name.trim(), {
      onSuccess: () => setName("")
    });
  };

  return (
    <section className="grid" style={{ gap: "1.5rem" }}>
      <div className="page-header">
        <div>
          <h1>🏷️ Tags</h1>
          <p style={{ color: "#6b7280", marginTop: "0.5rem" }}>
            Organize prompts and templates with lightweight labels.
          </p>
        </div>
      </div>

      {!isLoading && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1rem"
        }}>
          <div className="card" style={{ padding: "1.25rem", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🏷️</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#8b5cf6", marginBottom: "0.25rem" }}>
              {tags.length}
            </div>
            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Total Tags</div>
          </div>
        </div>
      )}

      <div className="card">
        <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 600, color: "#374151" }}>
          ➕ Create New Tag
        </h3>
        <form onSubmit={handleSubmit} className="action-bar">
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g., marketing, development, content"
            style={{ flex: 1 }}
          />
          <button className="primary-button" type="submit" disabled={createTag.isPending}>
            {createTag.isPending ? "Adding..." : "Add Tag"}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 600, color: "#374151" }}>
          📋 All Tags
        </h3>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <div className="loading" style={{ margin: "0 auto" }}></div>
            <div style={{ marginTop: "1rem", color: "#6b7280" }}>Loading tags...</div>
          </div>
        ) : tags.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🏷️</div>
            <p>No tags yet. Create one above to get started!</p>
          </div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {tags.map((tag, index) => (
              <li
                key={tag.slug}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "1rem",
                  borderBottom: index < tags.length - 1 ? "1px solid #f3f4f6" : "none",
                  transition: "background-color 0.2s ease"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span className="tag-pill">{tag.name}</span>
                  <span style={{ color: "#9ca3af", fontSize: "0.875rem" }}>
                    {tag.slug}
                  </span>
                </span>
                <button
                  className="danger-button"
                  type="button"
                  onClick={() => deleteTag.mutate(tag.slug)}
                  disabled={deleteTag.isPending}
                  style={{ padding: "0.5rem 0.875rem", fontSize: "0.875rem" }}
                >
                  🗑️ Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
