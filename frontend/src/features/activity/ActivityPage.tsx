export const ActivityPage = () => {
  return (
    <section className="grid" style={{ gap: "1.5rem" }}>
      <div className="page-header">
        <div>
          <h1>📊 Activity</h1>
          <p style={{ color: "#6b7280", marginTop: "0.5rem" }}>
            Recent changes and collaboration events.
          </p>
        </div>
      </div>

      <div className="card" style={{
        padding: "3rem 2rem",
        textAlign: "center",
        background: "linear-gradient(135deg, #eff6ff 0%, #f9fafb 100%)"
      }}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🚧</div>
        <h3 style={{
          margin: "0 0 1rem",
          fontSize: "1.5rem",
          fontWeight: 600,
          background: "linear-gradient(135deg, #1e293b 0%, #3b82f6 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text"
        }}>
          Activity Timeline Coming Soon
        </h3>
        <p style={{ color: "#6b7280", maxWidth: "500px", margin: "0 auto", lineHeight: 1.6 }}>
          This view will be connected to an audit trail endpoint to show recent changes,
          version history, and collaboration events. Stay tuned for updates!
        </p>
        <div style={{
          marginTop: "2rem",
          display: "flex",
          gap: "1rem",
          justifyContent: "center",
          flexWrap: "wrap"
        }}>
          <div style={{
            padding: "0.75rem 1.25rem",
            background: "white",
            borderRadius: "0.5rem",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)"
          }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>📝</div>
            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Version History</div>
          </div>
          <div style={{
            padding: "0.75rem 1.25rem",
            background: "white",
            borderRadius: "0.5rem",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)"
          }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>👥</div>
            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Collaborations</div>
          </div>
          <div style={{
            padding: "0.75rem 1.25rem",
            background: "white",
            borderRadius: "0.5rem",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)"
          }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>⏰</div>
            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Timeline View</div>
          </div>
        </div>
      </div>
    </section>
  );
};
