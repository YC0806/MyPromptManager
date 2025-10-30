import { useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

import {
  useCreatePrompt,
  useCreatePromptVersion,
  useDeletePrompt,
  usePrompt,
  usePromptVersions,
  useRestorePromptVersion,
  useUpdatePrompt
} from "./hooks";
import type { PromptVersion } from "../../types/models";

export const PromptDetailPage = () => {
  const params = useParams();
  const navigate = useNavigate();
  const isCreateMode = !params.promptId;
  const promptId = params.promptId ?? "";

  const { data: prompt, isLoading } = usePrompt(isCreateMode ? undefined : promptId);
  const { data: versions = [] } = usePromptVersions(
    isCreateMode ? undefined : promptId
  );

  const createPrompt = useCreatePrompt();
  const updatePrompt = useUpdatePrompt(promptId);
  const deletePrompt = useDeletePrompt();
  const createVersion = useCreatePromptVersion();
  const restoreVersion = useRestorePromptVersion();

  const [isEditing, setIsEditing] = useState(isCreateMode);
  const [showVersions, setShowVersions] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [metadata, setMetadata] = useState("{}");
  const [changelog, setChangelog] = useState("");
  const [isArchived, setIsArchived] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form when prompt loads
  useMemo(() => {
    if (prompt) {
      setName(prompt.name);
      setDescription(prompt.description ?? "");
      setContent(prompt.latest_version?.content ?? "");
      setTags(prompt.tags ?? []);
      setMetadata(JSON.stringify(prompt.latest_version?.metadata ?? {}, null, 2));
      setIsArchived(prompt.is_archived);
    }
  }, [prompt]);

  const handleSave = async () => {
    let metadataObject: Record<string, unknown> = {};
    if (metadata && metadata.trim()) {
      try {
        const parsed = JSON.parse(metadata);
        if (Array.isArray(parsed) || parsed === null || typeof parsed !== "object") {
          throw new Error("Metadata must be a JSON object.");
        }
        metadataObject = parsed;
      } catch (error) {
        setError(error instanceof Error ? error.message : "Metadata must be valid JSON.");
        return;
      }
    }
    setError(null);

    const payload = {
      name,
      description,
      tags,
      content,
      metadata: metadataObject,
      changelog,
      is_archived: isArchived
    };

    if (isCreateMode) {
      createPrompt.mutate(payload, {
        onSuccess: (created) => {
          navigate(`/prompts/${created.id}`);
        }
      });
    } else {
      updatePrompt.mutate(payload, {
        onSuccess: () => {
          setIsEditing(false);
          setChangelog("");
        }
      });
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this prompt?")) {
      deletePrompt.mutate(promptId, {
        onSuccess: () => navigate("/prompts")
      });
    }
  };

  const handleRestoreVersion = (version: PromptVersion) => {
    if (!prompt) return;
    const changelogNote = window.prompt(`Enter a changelog note for restoring v${version.version}:`);
    if (changelogNote === null) return;

    restoreVersion.mutate({
      promptId: prompt.id,
      version: version.version,
      changelog: changelogNote || undefined
    }, {
      onSuccess: () => {
        setShowVersions(false);
        setSelectedVersion(null);
      }
    });
  };

  const sortedVersions = useMemo(
    () => [...versions].sort((a, b) => b.version - a.version),
    [versions]
  );

  if (!isCreateMode && isLoading && !prompt) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "60vh"
      }}>
        <div className="loading"></div>
      </div>
    );
  }

  // Single-screen layout with three columns
  return (
    <div style={{
      height: "calc(100vh - 120px)",
      display: "flex",
      flexDirection: "column",
      gap: "1rem"
    }}>
      {/* Header Bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1rem 1.5rem",
        background: "linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)",
        borderRadius: "1rem",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link to="/prompts" style={{ textDecoration: "none", fontSize: "1.5rem" }}>←</Link>
          {!isEditing && !isCreateMode ? (
            <div>
              <h1 style={{ margin: 0, fontSize: "1.5rem" }}>{prompt?.name}</h1>
              <div style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.25rem" }}>
                v{prompt?.active_version?.version} · Updated {prompt && new Date(prompt.updated_at).toLocaleDateString()}
              </div>
            </div>
          ) : (
            <h1 style={{ margin: 0, fontSize: "1.5rem" }}>
              {isCreateMode ? "New Prompt" : "Edit Prompt"}
            </h1>
          )}
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          {!isCreateMode && !isEditing && (
            <>
              <button
                className="secondary-button"
                onClick={() => setShowVersions(!showVersions)}
              >
                📋 Versions ({versions.length})
              </button>
              <button
                className="primary-button"
                onClick={() => setIsEditing(true)}
              >
                ✏️ Edit
              </button>
              <button
                className="danger-button"
                onClick={handleDelete}
              >
                🗑️ Delete
              </button>
            </>
          )}
          {(isEditing || isCreateMode) && (
            <>
              {!isCreateMode && (
                <button
                  className="secondary-button"
                  onClick={() => {
                    setIsEditing(false);
                    setError(null);
                  }}
                >
                  Cancel
                </button>
              )}
              <button
                className="primary-button"
                onClick={handleSave}
                disabled={createPrompt.isPending || updatePrompt.isPending}
              >
                💾 Save
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div style={{
          padding: "1rem",
          background: "#fee",
          color: "#c00",
          borderRadius: "0.5rem",
          border: "1px solid #fcc"
        }}>
          {error}
        </div>
      )}

      {/* Main Content - Three Column Layout */}
      <div style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: showVersions ? "300px 1fr 350px" : "300px 1fr",
        gap: "1rem",
        overflow: "hidden"
      }}>
        {/* Left Sidebar - Meta Info */}
        <div style={{
          background: "linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)",
          borderRadius: "1rem",
          padding: "1.5rem",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          overflowY: "auto"
        }}>
          <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 600 }}>📝 Details</h3>

          {isEditing || isCreateMode ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <label>
                <div style={{ marginBottom: "0.5rem", fontWeight: 500, fontSize: "0.875rem" }}>Name</div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: "100%" }}
                  placeholder="Prompt name"
                />
              </label>

              <label>
                <div style={{ marginBottom: "0.5rem", fontWeight: 500, fontSize: "0.875rem" }}>Description</div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: "100%", minHeight: "80px", resize: "vertical" }}
                  placeholder="What does this prompt do?"
                />
              </label>

              <label>
                <div style={{ marginBottom: "0.5rem", fontWeight: 500, fontSize: "0.875rem" }}>Tags</div>
                <input
                  type="text"
                  value={tags.join(", ")}
                  onChange={(e) => setTags(e.target.value.split(",").map(t => t.trim()).filter(Boolean))}
                  style={{ width: "100%" }}
                  placeholder="tag1, tag2"
                />
              </label>

              <label>
                <div style={{ marginBottom: "0.5rem", fontWeight: 500, fontSize: "0.875rem" }}>Changelog</div>
                <textarea
                  value={changelog}
                  onChange={(e) => setChangelog(e.target.value)}
                  style={{ width: "100%", minHeight: "60px", resize: "vertical" }}
                  placeholder="What changed?"
                />
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  checked={isArchived}
                  onChange={(e) => setIsArchived(e.target.checked)}
                />
                <span style={{ fontSize: "0.875rem" }}>Archived</span>
              </label>

              <button
                onClick={() => setShowMetadata(!showMetadata)}
                className="secondary-button"
                style={{ fontSize: "0.875rem", padding: "0.5rem" }}
              >
                {showMetadata ? "Hide" : "Show"} Metadata
              </button>

              {showMetadata && (
                <label>
                  <div style={{ marginBottom: "0.5rem", fontWeight: 500, fontSize: "0.875rem" }}>Metadata (JSON)</div>
                  <textarea
                    value={metadata}
                    onChange={(e) => setMetadata(e.target.value)}
                    style={{
                      width: "100%",
                      minHeight: "100px",
                      fontFamily: "monospace",
                      fontSize: "0.8rem",
                      resize: "vertical"
                    }}
                    placeholder='{"key": "value"}'
                  />
                </label>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.25rem" }}>Description</div>
                <div style={{ fontSize: "0.9rem" }}>{prompt?.description || "No description"}</div>
              </div>

              <div>
                <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.5rem" }}>Tags</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {prompt?.tags && prompt.tags.length > 0 ? (
                    prompt.tags.map(tag => (
                      <span key={tag} className="tag-pill">{tag}</span>
                    ))
                  ) : (
                    <span style={{ fontSize: "0.875rem", color: "#9ca3af" }}>No tags</span>
                  )}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.25rem" }}>Status</div>
                <div style={{ fontSize: "0.9rem" }}>
                  {prompt?.is_archived ? "📦 Archived" : "✅ Active"}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.25rem" }}>Created</div>
                <div style={{ fontSize: "0.875rem" }}>
                  {prompt && new Date(prompt.created_at).toLocaleString()}
                </div>
              </div>

              {prompt?.latest_version?.changelog && (
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.25rem" }}>Last Changelog</div>
                  <div style={{
                    fontSize: "0.875rem",
                    padding: "0.5rem",
                    background: "#f9fafb",
                    borderRadius: "0.5rem",
                    fontStyle: "italic"
                  }}>
                    {prompt.latest_version.changelog}
                  </div>
                </div>
              )}

              {prompt?.latest_version?.metadata && Object.keys(prompt.latest_version.metadata).length > 0 && (
                <div>
                  <button
                    onClick={() => setShowMetadata(!showMetadata)}
                    className="secondary-button"
                    style={{ fontSize: "0.875rem", padding: "0.5rem", width: "100%" }}
                  >
                    {showMetadata ? "Hide" : "Show"} Metadata
                  </button>
                  {showMetadata && (
                    <pre style={{
                      marginTop: "0.5rem",
                      fontSize: "0.75rem",
                      background: "#0f172a",
                      color: "#f3f4f6",
                      padding: "0.75rem",
                      borderRadius: "0.5rem",
                      overflow: "auto",
                      maxHeight: "200px"
                    }}>
                      {JSON.stringify(prompt.latest_version.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center - Content Editor/Viewer */}
        <div style={{
          background: "linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)",
          borderRadius: "1rem",
          padding: "1.5rem",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}>
          <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 600 }}>💬 Content</h3>

          {isEditing || isCreateMode ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{
                flex: 1,
                width: "100%",
                padding: "1rem",
                border: "2px solid #e5e7eb",
                borderRadius: "0.75rem",
                fontFamily: "monospace",
                fontSize: "0.95rem",
                lineHeight: 1.6,
                resize: "none"
              }}
              placeholder="Enter your prompt content here..."
            />
          ) : (
            <div style={{
              flex: 1,
              padding: "1rem",
              background: "#f9fafb",
              borderRadius: "0.75rem",
              overflow: "auto",
              fontFamily: "system-ui",
              fontSize: "0.95rem",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap"
            }}>
              {prompt?.latest_version?.content || "No content available"}
            </div>
          )}
        </div>

        {/* Right Sidebar - Version History */}
        {showVersions && !isCreateMode && (
          <div style={{
            background: "linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)",
            borderRadius: "1rem",
            padding: "1.5rem",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}>
            <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 600 }}>📋 Version History</h3>

            {sortedVersions.length === 0 ? (
              <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>No versions yet</p>
            ) : (
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {sortedVersions.map((version) => (
                  <div
                    key={version.id}
                    style={{
                      padding: "0.75rem",
                      background: selectedVersion?.id === version.id ? "#eff6ff" : "#f9fafb",
                      borderRadius: "0.5rem",
                      cursor: "pointer",
                      border: selectedVersion?.id === version.id ? "2px solid #3b82f6" : "1px solid #e5e7eb",
                      transition: "all 0.2s ease"
                    }}
                    onClick={() => setSelectedVersion(selectedVersion?.id === version.id ? null : version)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ fontSize: "0.9rem" }}>v{version.version}</strong>
                      <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                        {new Date(version.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {version.changelog && (
                      <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                        {version.changelog}
                      </div>
                    )}
                    {selectedVersion?.id === version.id && (
                      <div style={{ marginTop: "0.75rem" }}>
                        <button
                          className="primary-button"
                          style={{ fontSize: "0.75rem", padding: "0.375rem 0.75rem", width: "100%" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestoreVersion(version);
                          }}
                          disabled={restoreVersion.isPending}
                        >
                          Restore v{version.version}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
