import { useState } from "react";

const sidebarItems = [
  { label: "Panel", icon: "⊞" },
  { label: "Projeler", icon: "◫" },
  { label: "Takvim", icon: "◻" },
  { label: "Bildirimler", icon: "◬" },
  { label: "Ayarlar", icon: "◎" },
];

const stats = [
  { label: "Aktif Görevler", value: "24", delta: "+3 bu hafta" },
  { label: "Tamamlanan", value: "118", delta: "+12 bu ay" },
  { label: "Projeler", value: "7", delta: "2 yakında bitiyor" },
];

const tasks = [
  { title: "Kullanıcı arayüzü revizyonu", project: "Ürün Tasarımı", priority: "Yüksek", due: "Bugün", status: 75 },
  { title: "API entegrasyonu", project: "Backend", priority: "Orta", due: "Yarın", status: 40 },
  { title: "Performans testleri", project: "QA", priority: "Düşük", due: "Cum", status: 10 },
  { title: "Mobil uyumluluk", project: "Frontend", priority: "Yüksek", due: "Paz", status: 60 },
];

const priorityColors: Record<string, string> = {
  Yüksek: "#FF5757",
  Orta: "#FFB547",
  Düşük: "#4ADE80",
};

export default function WorkspacePage() {
  const [activeItem, setActiveItem] = useState("Panel");

  const handleLogout = () => {
    window.localStorage.removeItem("taskflow_access_token");
    window.localStorage.removeItem("taskflow_refresh_token");
    window.location.href = "/auth/login";
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .workspace-root {
          min-height: 100vh;
          background: #0A0A0F;
          font-family: 'Syne', sans-serif;
          display: flex;
          justify-content: center;
          overflow-x: hidden;
        }

        .workspace-grid {
          width: 100%;
          max-width: 1280px;
          display: grid;
          grid-template-columns: 220px 1fr;
          min-height: 100vh;
        }

        /* ── SIDEBAR ── */
        .sidebar {
          background: #0F0F17;
          border-right: 1px solid rgba(255,255,255,0.05);
          display: flex;
          flex-direction: column;
          padding: 28px 16px;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow: hidden;
        }

        .sidebar::before {
          content: '';
          position: absolute;
          top: -60px;
          left: -40px;
          width: 180px;
          height: 180px;
          background: radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%);
          pointer-events: none;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 8px;
          margin-bottom: 36px;
        }

        .brand-mark {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
          border-radius: 8px;
          display: grid;
          place-items: center;
          font-size: 14px;
          color: #fff;
          flex-shrink: 0;
        }

        .brand-name {
          font-size: 18px;
          font-weight: 800;
          color: #F9FAFB;
          letter-spacing: -0.5px;
        }

        .nav-label {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          font-weight: 500;
          color: rgba(255,255,255,0.25);
          letter-spacing: 2px;
          text-transform: uppercase;
          padding: 0 8px;
          margin-bottom: 8px;
        }

        .nav-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .nav-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          border: none;
          border-radius: 10px;
          padding: 10px 12px;
          cursor: pointer;
          width: 100%;
          text-align: left;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.18s ease;
          position: relative;
          overflow: hidden;
          background: transparent;
          color: rgba(255,255,255,0.45);
        }

        .nav-btn:hover {
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.8);
        }

        .nav-btn.active {
          background: rgba(99,102,241,0.15);
          color: #A5B4FC;
          font-weight: 700;
        }

        .nav-btn.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 20%;
          height: 60%;
          width: 3px;
          background: #6366F1;
          border-radius: 0 3px 3px 0;
        }

        .nav-icon {
          width: 20px;
          height: 20px;
          display: grid;
          place-items: center;
          font-size: 15px;
          opacity: 0.7;
        }

        .sidebar-footer {
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }

        .user-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 8px;
          border-radius: 10px;
          margin-bottom: 8px;
        }

        .avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366F1, #EC4899);
          display: grid;
          place-items: center;
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
        }

        .user-info { flex: 1; overflow: hidden; }
        .user-name { font-size: 13px; font-weight: 700; color: #F3F4F6; }
        .user-role { font-size: 11px; color: rgba(255,255,255,0.35); font-family: 'DM Mono', monospace; }

        .logout-btn {
          width: 100%;
          border: none;
          border-radius: 10px;
          padding: 9px 12px;
          cursor: pointer;
          background: rgba(239,68,68,0.08);
          color: #F87171;
          font-weight: 600;
          font-size: 13px;
          font-family: 'Syne', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.18s ease;
          border: 1px solid rgba(239,68,68,0.12);
        }

        .logout-btn:hover {
          background: rgba(239,68,68,0.15);
          border-color: rgba(239,68,68,0.3);
        }

        /* ── MAIN ── */
        .main {
          background: #0A0A0F;
          padding: 32px 36px;
          overflow-y: auto;
        }

        .topbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 32px;
        }

        .page-title {
          font-size: 28px;
          font-weight: 800;
          color: #F9FAFB;
          letter-spacing: -1px;
        }

        .page-sub {
          font-size: 13px;
          color: rgba(255,255,255,0.35);
          margin-top: 4px;
          font-family: 'DM Mono', monospace;
        }

        .add-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
          border: none;
          border-radius: 10px;
          padding: 10px 18px;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(99,102,241,0.3);
          transition: all 0.18s ease;
        }

        .add-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(99,102,241,0.4);
        }

        /* Stats */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 28px;
        }

        .stat-card {
          background: #13131C;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 20px 22px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s;
        }

        .stat-card:hover { border-color: rgba(99,102,241,0.3); }

        .stat-card::after {
          content: '';
          position: absolute;
          bottom: -20px;
          right: -20px;
          width: 80px;
          height: 80px;
          background: radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%);
          pointer-events: none;
        }

        .stat-label {
          font-size: 11px;
          font-weight: 500;
          color: rgba(255,255,255,0.35);
          text-transform: uppercase;
          letter-spacing: 1.5px;
          font-family: 'DM Mono', monospace;
          margin-bottom: 10px;
        }

        .stat-value {
          font-size: 36px;
          font-weight: 800;
          color: #F9FAFB;
          letter-spacing: -2px;
          line-height: 1;
          margin-bottom: 8px;
        }

        .stat-delta {
          font-size: 12px;
          color: #4ADE80;
          font-family: 'DM Mono', monospace;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* Tasks */
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .section-title {
          font-size: 16px;
          font-weight: 700;
          color: #F9FAFB;
          letter-spacing: -0.3px;
        }

        .view-all {
          font-size: 12px;
          color: #6366F1;
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'DM Mono', monospace;
          transition: opacity 0.15s;
        }

        .view-all:hover { opacity: 0.7; }

        .tasks-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .task-row {
          background: #13131C;
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px;
          padding: 16px 18px;
          display: grid;
          grid-template-columns: 1fr auto auto 180px;
          align-items: center;
          gap: 16px;
          transition: all 0.18s ease;
        }

        .task-row:hover {
          border-color: rgba(255,255,255,0.1);
          background: #16161F;
          transform: translateX(4px);
        }

        .task-title {
          font-size: 14px;
          font-weight: 600;
          color: #E5E7EB;
        }

        .task-project {
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          font-family: 'DM Mono', monospace;
          margin-top: 3px;
        }

        .priority-tag {
          font-size: 11px;
          font-weight: 700;
          font-family: 'DM Mono', monospace;
          padding: 3px 9px;
          border-radius: 20px;
          border: 1px solid;
          white-space: nowrap;
        }

        .due-tag {
          font-size: 12px;
          color: rgba(255,255,255,0.4);
          font-family: 'DM Mono', monospace;
          white-space: nowrap;
          min-width: 44px;
          text-align: right;
        }

        .progress-wrap { display: flex; align-items: center; gap: 10px; }

        .progress-bar {
          flex: 1;
          height: 4px;
          background: rgba(255,255,255,0.07);
          border-radius: 99px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 99px;
          background: linear-gradient(90deg, #6366F1, #A78BFA);
          transition: width 0.4s ease;
        }

        .progress-pct {
          font-size: 11px;
          font-family: 'DM Mono', monospace;
          color: rgba(255,255,255,0.3);
          min-width: 28px;
          text-align: right;
        }

        /* Bottom grid */
        .bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 28px;
        }

        .card {
          background: #13131C;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 22px;
        }

        .activity-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }

        .activity-item:last-child { border-bottom: none; }

        .activity-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #6366F1;
          flex-shrink: 0;
          margin-top: 5px;
        }

        .activity-text {
          font-size: 13px;
          color: rgba(255,255,255,0.55);
          line-height: 1.5;
        }

        .activity-text strong { color: rgba(255,255,255,0.85); font-weight: 600; }

        .activity-time {
          font-size: 11px;
          color: rgba(255,255,255,0.2);
          font-family: 'DM Mono', monospace;
          margin-left: auto;
          flex-shrink: 0;
          padding-left: 8px;
        }

        /* Chart placeholder */
        .mini-bars {
          display: flex;
          align-items: flex-end;
          gap: 6px;
          height: 80px;
          margin-top: 16px;
        }

        .bar {
          flex: 1;
          border-radius: 5px 5px 0 0;
          background: linear-gradient(180deg, #6366F1 0%, rgba(99,102,241,0.3) 100%);
          min-height: 8px;
          transition: opacity 0.2s;
        }

        .bar:hover { opacity: 0.75; }

        .chart-labels {
          display: flex;
          gap: 6px;
          margin-top: 8px;
        }

        .chart-label {
          flex: 1;
          text-align: center;
          font-size: 10px;
          color: rgba(255,255,255,0.2);
          font-family: 'DM Mono', monospace;
        }
      `}</style>

      <main className="workspace-root">
        <section className="workspace-grid">

          {/* SIDEBAR */}
          <aside className="sidebar">
            <div className="brand">
              <div className="brand-mark">T</div>
              <span className="brand-name">TaskFlow</span>
            </div>

            <div className="nav-label">Menü</div>
            <nav className="nav-list">
              {sidebarItems.map(({ label, icon }) => (
                <button
                  key={label}
                  className={`nav-btn${activeItem === label ? " active" : ""}`}
                  onClick={() => setActiveItem(label)}
                >
                  <span className="nav-icon">{icon}</span>
                  {label}
                </button>
              ))}
            </nav>

            <div className="sidebar-footer">
              <div className="user-card">
                <div className="avatar">AY</div>
                <div className="user-info">
                  <div className="user-name">Ahmet Yılmaz</div>
                  <div className="user-role">Pro Plan</div>
                </div>
              </div>
              <button className="logout-btn" onClick={handleLogout}>
                <span>↩</span> Çıkış Yap
              </button>
            </div>
          </aside>

          {/* MAIN */}
          <main className="main">
            <div className="topbar">
              <div>
                <h1 className="page-title">Panel</h1>
                <p className="page-sub">Pzt, 22 Şubat 2026</p>
              </div>
              <button className="add-btn">
                <span>+</span> Yeni Görev
              </button>
            </div>

            {/* Stats */}
            <div className="stats-grid">
              {stats.map((s) => (
                <div key={s.label} className="stat-card">
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-delta">↑ {s.delta}</div>
                </div>
              ))}
            </div>

            {/* Tasks */}
            <div className="section-header">
              <span className="section-title">Aktif Görevler</span>
              <button className="view-all">tümünü gör →</button>
            </div>

            <div className="tasks-list">
              {tasks.map((t) => (
                <div key={t.title} className="task-row">
                  <div>
                    <div className="task-title">{t.title}</div>
                    <div className="task-project">{t.project}</div>
                  </div>
                  <span
                    className="priority-tag"
                    style={{
                      color: priorityColors[t.priority],
                      borderColor: `${priorityColors[t.priority]}40`,
                      background: `${priorityColors[t.priority]}10`,
                    }}
                  >
                    {t.priority}
                  </span>
                  <div className="due-tag">{t.due}</div>
                  <div className="progress-wrap">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${t.status}%` }} />
                    </div>
                    <span className="progress-pct">{t.status}%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom */}
            <div className="bottom-grid">
              <div className="card">
                <div className="section-title" style={{ marginBottom: 4 }}>Son Aktiviteler</div>
                {[
                  { text: <><strong>API entegrasyonu</strong> görevi güncellendi</>, time: "2 dk" },
                  { text: <><strong>Mobil uyumluluk</strong> %60 tamamlandı</>, time: "1 sa" },
                  { text: <><strong>Yeni proje</strong> oluşturuldu: QA</>, time: "3 sa" },
                  { text: <><strong>Performans testleri</strong> atandı</>, time: "Dün" },
                ].map((a, i) => (
                  <div key={i} className="activity-item">
                    <div className="activity-dot" />
                    <span className="activity-text">{a.text}</span>
                    <span className="activity-time">{a.time}</span>
                  </div>
                ))}
              </div>

              <div className="card">
                <div className="section-title">Haftalık İlerleme</div>
                <div className="mini-bars">
                  {[45, 70, 55, 80, 60, 90, 40].map((h, i) => (
                    <div key={i} className="bar" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="chart-labels">
                  {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((d) => (
                    <span key={d} className="chart-label">{d}</span>
                  ))}
                </div>
              </div>
            </div>
          </main>

        </section>
      </main>
    </>
  );
}