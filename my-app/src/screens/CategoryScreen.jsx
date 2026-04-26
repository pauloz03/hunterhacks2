import { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import VisitorFooterNav from "../components/VisitorFooterNav";
import guideData from "./guideData.json";

const SLUG_TO_GUIDE_ID = {
  "transit":      "getting-around",
  "health":       "finding-a-doctor",
  "banking":      "banking-money",
  "community":    "community",
  "emergency":    "emergency",
  "food":         "finding-food",
  "school":       "enrolling-kids",
  "housing":      "housing-basics",
  "legal-rights": "know-your-rights",
  "work":         "finding-work",
};

const TEAL = {
  dark: "#085041",
  mid: "#0F6E56",
  light: "#E1F5EE",
  border: "#9FE1CB",
};

function formatSlug(slug) {
  return slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function GuideCard({ topic, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: "20px 20px 0 0",
        width: "100%", maxWidth: 480, maxHeight: "85vh",
        overflowY: "auto", paddingBottom: 32,
        boxShadow: "0 -4px 32px rgba(0,0,0,0.12)",
      }} onClick={e => e.stopPropagation()}>

        <div style={{
          background: TEAL.mid, padding: "20px 20px 16px",
          borderRadius: "20px 20px 0 0", position: "sticky", top: 0, zIndex: 1,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, margin: "0 0 4px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Guide
              </p>
              <h2 style={{ color: "#fff", fontSize: 17, fontWeight: 600, margin: 0, lineHeight: 1.35 }}>
                {topic.title}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, margin: "6px 0 0" }}>
                {topic.readTime} read
              </p>
            </div>
            <button onClick={onClose} style={{
              background: "rgba(255,255,255,0.2)", border: "none",
              borderRadius: "50%", width: 32, height: 32, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 18, flexShrink: 0,
            }}>×</button>
          </div>
        </div>

        <div style={{ padding: "20px 20px 0" }}>
          {topic.steps.map((step, i) => (
            <div key={i} style={{
              display: "flex", gap: 14, paddingBottom: 16,
              borderBottom: i < topic.steps.length - 1 ? `1px solid ${TEAL.border}` : "none",
              marginBottom: i < topic.steps.length - 1 ? 16 : 0,
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%",
                background: TEAL.light, color: TEAL.dark,
                fontSize: 12, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, marginTop: 1,
              }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", margin: "0 0 4px" }}>{step.title}</p>
                <p style={{ fontSize: 13, color: "#555", margin: 0, lineHeight: 1.6 }}>{step.detail}</p>
              </div>
            </div>
          ))}
        </div>

        {topic.tip && (
          <div style={{
            margin: "20px 20px 0", background: TEAL.light,
            borderRadius: 12, padding: "12px 14px", display: "flex", gap: 10,
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: TEAL.mid, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Pro tip</p>
              <p style={{ fontSize: 13, color: TEAL.dark, margin: 0, lineHeight: 1.55 }}>{topic.tip}</p>
            </div>
          </div>
        )}

        {topic.tags && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "16px 20px 0" }}>
            {topic.tags.map((tag, i) => (
              <span key={i} style={{
                fontSize: 12, padding: "4px 12px", borderRadius: 20,
                background: TEAL.light, color: TEAL.dark, fontWeight: 500,
              }}>{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CategoryScreen() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { state } = useLocation();
  const cat = state?.cat ?? { slug, icon: "📋" };

  const guideId = SLUG_TO_GUIDE_ID[slug];
  const guideCategory = guideData.categories.find(c => c.id === guideId);

  const [selectedTopic, setSelectedTopic] = useState(null);

  return (
    <main style={{ background: "#f7f8f6", minHeight: "100vh", paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        background: TEAL.mid, padding: "20px 20px 24px",
        display: "flex", alignItems: "center", gap: 14,
      }}>
        <button onClick={() => navigate(-1)} style={{
          background: "rgba(255,255,255,0.2)", border: "none",
          borderRadius: "50%", width: 36, height: 36, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 20, flexShrink: 0,
        }}>‹</button>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 32 }}>{cat.icon}</span>
          <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: 0 }}>
            {formatSlug(slug)}
          </h1>
        </div>
      </div>

      {/* Topic list */}
      <div style={{ padding: "16px 16px 0" }}>
        {guideCategory ? (
          guideCategory.topics.map((topic, i) => (
            <button
              key={topic.id}
              onClick={() => setSelectedTopic(topic)}
              style={{
                width: "100%", background: "#fff", border: "none",
                borderRadius: 14, padding: "14px 16px",
                marginBottom: 10, display: "flex", alignItems: "center", gap: 12,
                cursor: "pointer", textAlign: "left",
                boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: TEAL.light, color: TEAL.dark,
                fontSize: 13, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>{i + 1}</div>
              <span style={{ flex: 1, fontSize: 14, color: "#1a1a1a", lineHeight: 1.4 }}>{topic.title}</span>
              <span style={{ color: TEAL.mid, fontSize: 16 }}>›</span>
            </button>
          ))
        ) : (
          <p style={{ color: "#888", fontSize: 14, padding: "20px 0" }}>No guides available yet.</p>
        )}
      </div>

      <VisitorFooterNav />

      {selectedTopic && (
        <GuideCard topic={selectedTopic} onClose={() => setSelectedTopic(null)} />
      )}
    </main>
  );
}
