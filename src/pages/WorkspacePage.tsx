import { useState } from "react";

/* ─── tiny helpers ─── */
function Avatar({
  initials,
  bg,
  size = 32,
  border = true,
}: {
  initials: string;
  bg: string;
  size?: number;
  border?: boolean;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: size * 0.36,
        fontWeight: 700,
        flexShrink: 0,
        border: border ? "2px solid #fff" : "none",
      }}
    >
      {initials}
    </div>
  );
}

function AvatarStack({
  list,
  extra,
}: {
  list: { initials: string; bg: string }[];
  extra: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {list.map((a, i) => (
        <div key={i} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: list.length - i }}>
          <Avatar initials={a.initials} bg={a.bg} size={26} />
        </div>
      ))}
      {extra > 0 && (
        <div
          style={{
            marginLeft: -8,
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: "#E5E7EB",
            border: "2px solid #fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 700,
            color: "#6B7280",
          }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span
      style={{
        background: bg,
        color,
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 9px",
        borderRadius: 6,
      }}
    >
      {label}
    </span>
  );
}

/* ─── data ─── */
const departments = [
  {
    name: "Engineering",
    desc: "Responsible for core platform development and API integration.",
    iconBg: "#EFF6FF",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    avatars: [
      { initials: "SM", bg: "#4F46E5" },
      { initials: "DK", bg: "#059669" },
    ],
    extra: 9,
  },
  {
    name: "Marketing",
    desc: "Campaign strategy, social media management, and branding.",
    iconBg: "#FFF7ED",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    avatars: [{ initials: "AL", bg: "#DC2626" }],
    extra: 6,
  },
];

const tasks = [
  {
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#9CA3AF" strokeWidth="2" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    title: "Q3 Financial Report",
    calIcon: "📅",
    when: "Today",
    tag: "Accounting",
    badge: { label: "High", color: "#DC2626", bg: "#FEE2E2" },
    avatar: { initials: "SM", bg: "#4F46E5" },
  },
  {
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" stroke="#9CA3AF" strokeWidth="2" />
        <path d="M12 7v5l3 3" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    title: "Update Homepage Hero",
    calIcon: "📅",
    when: "Tomorrow",
    tag: "Design",
    badge: { label: "Med", color: "#D97706", bg: "#FEF3C7" },
    avatar: { initials: "DK", bg: "#059669" },
  },
  {
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
        <polyline points="16 18 22 12 16 6" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="8 6 2 12 8 18" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "API Documentation",
    calIcon: "⏱",
    when: "Done",
    tag: "Dev Team",
    badge: { label: "Low", color: "#16A34A", bg: "#DCFCE7" },
    avatar: { initials: "AL", bg: "#DC2626" },
  },
];

const activities = [
  { name: "Sarah M.", action: "commented on", target: "Logo Redesign", time: "10 mins ago" },
  { name: "David K.", action: "completed", target: "User Flow Diagram", time: "1 hour ago" },
  { name: "New File", action: "uploaded to", target: "Assets", time: "3 hours ago" },
];

const bottomTabs = ["Home", "Tasks", "Chat", "Menu"];

/* ─── component ─── */
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("Home");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F3F4F6",
        fontFamily: "'DM Sans','Segoe UI',sans-serif",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "0 20px",
      }}
    >
      {/* ── outer card that mimics the original phone frame but wider ── */}
      <div
        style={{
          width: "100%",
          maxWidth: 1200,
          minHeight: "100vh",
          background: "#F3F4F6",
          borderRadius: 24,
          boxShadow: "0 4px 40px rgba(0,0,0,0.10)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* ════ HEADER ════ */}
        <div style={{ background: "#fff", padding: "20px 32px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 12, color: "#9CA3AF" }}>Monday, Oct 24</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#111827" }}>Welcome back, Alex</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ position: "relative", cursor: "pointer" }}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div style={{ position: "absolute", top: -3, right: -3, width: 8, height: 8, background: "#EF4444", borderRadius: "50%", border: "1.5px solid #fff" }} />
              </div>
              <Avatar initials="AX" bg="#4F46E5" size={36} border={false} />
            </div>
          </div>

          {/* search */}
          <div
            style={{
              marginTop: 14,
              background: "#F9FAFB",
              border: "1px solid #E5E7EB",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
            }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" stroke="#9CA3AF" strokeWidth="2" />
              <path d="M21 21l-4.35-4.35" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 13, color: "#9CA3AF" }}>Search tasks, departments...</span>
          </div>
        </div>

        {/* ════ BODY ════ */}
        <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: 28 }}>

          {/* ── Overview ── */}
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>Overview</span>
              <span style={{ fontSize: 12, color: "#3B5BDB", fontWeight: 600, cursor: "pointer" }}>View Report</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 1fr", gap: 16 }}>
              {/* Pending */}
              <div style={{ background: "#fff", borderRadius: 16, padding: "22px 20px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ marginBottom: 8, display: "flex", justifyContent: "center" }}>
                  <div style={{ width: 40, height: 40, background: "#FFF7ED", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" stroke="#F97316" strokeWidth="2" />
                      <path d="M12 7v5l3 3" stroke="#F97316" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
                <div style={{ fontSize: 36, fontWeight: 900, color: "#111827" }}>12</div>
                <div style={{ fontSize: 10, color: "#9CA3AF", letterSpacing: 1.2, marginTop: 4 }}>PENDING</div>
              </div>

              {/* Active */}
              <div style={{ background: "#2D4FE0", borderRadius: 16, padding: "22px 20px", textAlign: "center", boxShadow: "0 6px 24px rgba(45,79,224,0.40)" }}>
                <div style={{ marginBottom: 8, display: "flex", justifyContent: "center" }}>
                  <div style={{ width: 40, height: 40, background: "rgba(255,255,255,0.18)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                <div style={{ fontSize: 36, fontWeight: 900, color: "#fff" }}>5</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", letterSpacing: 1.2, marginTop: 4 }}>ACTIVE</div>
              </div>

              {/* Done */}
              <div style={{ background: "#fff", borderRadius: 16, padding: "22px 20px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ marginBottom: 8, display: "flex", justifyContent: "center" }}>
                  <div style={{ width: 40, height: 40, background: "#F0FDF4", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" stroke="#22C55E" strokeWidth="2" />
                      <path d="M9 12l2 2 4-4" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                <div style={{ fontSize: 36, fontWeight: 900, color: "#111827" }}>28</div>
                <div style={{ fontSize: 10, color: "#9CA3AF", letterSpacing: 1.2, marginTop: 4 }}>DONE</div>
              </div>
            </div>
          </section>

          {/* ── Departments ── */}
          <section>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 14 }}>Departments</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {departments.map((dept, i) => (
                <div
                  key={i}
                  style={{ background: "#fff", borderRadius: 16, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", cursor: "pointer" }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: dept.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {dept.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{dept.name}</div>
                      <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 3, lineHeight: 1.5 }}>{dept.desc}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <AvatarStack list={dept.avatars} extra={dept.extra} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Recent Tasks + Group Activity side by side ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>

            {/* Recent Tasks */}
            <section>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>Recent Tasks</span>
                <span style={{ fontSize: 12, color: "#3B5BDB", fontWeight: 600, cursor: "pointer" }}>View All</span>
              </div>
              <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                {tasks.map((t, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "16px 20px",
                      borderBottom: i < tasks.length - 1 ? "1px solid #F3F4F6" : "none",
                      cursor: "pointer",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ width: 36, height: 36, background: "#F9FAFB", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {t.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{t.title}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 3 }}>
                        {t.calIcon} {t.when} · {t.tag}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                      <Badge label={t.badge.label} color={t.badge.color} bg={t.badge.bg} />
                      <Avatar initials={t.avatar.initials} bg={t.avatar.bg} size={30} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Group Activity */}
            <section>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 14 }}>Group Activity</div>
              <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", padding: "8px 20px" }}>
                {activities.map((a, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "12px 0",
                      borderBottom: i < activities.length - 1 ? "1px solid #F3F4F6" : "none",
                    }}
                  >
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#3B5BDB", marginTop: 6, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 700 }}>{a.name}</span>{" "}
                        <span style={{ color: "#6B7280" }}>{a.action}</span>{" "}
                        <span style={{ color: "#3B5BDB", fontWeight: 600, cursor: "pointer" }}>{a.target}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{a.time}</div>
                    </div>
                  </div>
                ))}
                <div style={{ textAlign: "center", padding: "12px 0 6px", fontSize: 13, color: "#6B7280", fontWeight: 500, cursor: "pointer" }}>
                  View Activity Log
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* ════ BOTTOM NAV ════ */}
        <div
          style={{
            background: "#fff",
            borderTop: "1px solid #F1F1F1",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            padding: "12px 0 16px",
            position: "sticky",
            bottom: 0,
          }}
        >
          {bottomTabs.slice(0, 2).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: activeTab === tab ? "#3B5BDB" : "#9CA3AF", padding: "0 24px" }}
            >
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                {tab === "Home" && <><path d="M3 12L12 3l9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></>}
                {tab === "Tasks" && <><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" /><path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></>}
              </svg>
              <span style={{ fontSize: 10, fontWeight: activeTab === tab ? 700 : 500 }}>{tab}</span>
            </button>
          ))}

          {/* FAB */}
          <button
            style={{ width: 50, height: 50, borderRadius: "50%", background: "#3B5BDB", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 16px rgba(59,91,219,0.45)" }}
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>

          {bottomTabs.slice(2).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: activeTab === tab ? "#3B5BDB" : "#9CA3AF", padding: "0 24px" }}
            >
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                {tab === "Chat" && <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
                {tab === "Menu" && <><rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" /><rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" /><rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" /><rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" /></>}
              </svg>
              <span style={{ fontSize: 10, fontWeight: activeTab === tab ? 700 : 500 }}>{tab}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
