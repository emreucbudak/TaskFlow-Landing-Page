import Icon from "../../shared/components/Icon";

/* ─── Monitor Screen Content ─── */
const MonitorScreen = () => (
  <img src="/laptop-screen.png" alt="TaskFlow Dashboard" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
);

/* ─── Laptop Screen Content ─── */
const LaptopScreen = () => (
  <img src="/monitor-screen.png" alt="TaskFlow Tasks" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
);

/* ─── Device Shell Components ─── */

const CameraDot = ({ size = 5 }: { size?: number }) => (
  <div style={{
    width: `${size}px`, height: `${size}px`, borderRadius: "50%",
    background: "radial-gradient(circle at 33% 33%, #1a2e2c 0%, #050505 65%)",
    boxShadow: "0 0 0 1px #0a0a0a, 0 0 3px rgba(19,236,200,0.12)",
  }} />
);

const Monitor = () => (
  <div style={{ width: "460px", flexShrink: 0 }}>
    {/* Screen bezel */}
    <div style={{
      background: "linear-gradient(155deg, #2a2a2a 0%, #0d0d0d 20%, #1c1c1c 40%, #080808 60%, #161616 80%, #0a0a0a 100%)",
      borderRadius: "10px",
      padding: "5px",
      position: "relative",
      boxShadow: "0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.08)",
    }}>
      {/* Glass reflection */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: "10px",
        background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 35%)",
        pointerEvents: "none", zIndex: 10,
      }} />
      {/* Screen */}
      <div style={{ borderRadius: "4px", overflow: "hidden", height: "235px" }}>
        <MonitorScreen />
      </div>
    </div>
    {/* Neck */}
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div style={{
        width: "28px", height: "32px",
        background: "linear-gradient(180deg, #1a1a1a 0%, #2a2a2a 50%, #222 100%)",
        boxShadow: "2px 0 6px rgba(0,0,0,0.2), -2px 0 6px rgba(0,0,0,0.2)",
      }} />
    </div>
    {/* Stand feet — two angled legs */}
    <div style={{
      display: "flex", justifyContent: "center", alignItems: "flex-start",
      position: "relative", height: "14px",
    }}>
      {/* Left foot */}
      <div style={{
        width: "50px", height: "5px",
        background: "linear-gradient(180deg, #2a2a2a, #1a1a1a)",
        borderRadius: "3px",
        transform: "rotate(12deg)",
        transformOrigin: "right center",
        position: "absolute",
        left: "calc(50% - 50px)",
        top: "2px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
      }} />
      {/* Right foot */}
      <div style={{
        width: "50px", height: "5px",
        background: "linear-gradient(180deg, #2a2a2a, #1a1a1a)",
        borderRadius: "3px",
        transform: "rotate(-12deg)",
        transformOrigin: "left center",
        position: "absolute",
        left: "50%",
        top: "2px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
      }} />
    </div>
  </div>
);

const Laptop = () => (
  <div style={{ width: "350px", flexShrink: 0 }}>
    {/* Screen */}
    <div style={{
      background: "linear-gradient(155deg, #2a2a2a 0%, #0d0d0d 20%, #1c1c1c 40%, #080808 60%)",
      borderRadius: "8px 8px 0 0",
      padding: "5px 5px 0 5px",
      position: "relative",
      boxShadow: "0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.06)",
    }}>
      <div style={{
        position: "absolute", inset: 0, borderRadius: "8px 8px 0 0",
        background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 30%)",
        pointerEvents: "none", zIndex: 10,
      }} />
      <div style={{ display: "flex", justifyContent: "center", padding: "2px 0" }}>
        <CameraDot size={4} />
      </div>
      <div style={{ borderRadius: "2px 2px 0 0", overflow: "hidden", height: "179px" }}>
        <LaptopScreen />
      </div>
    </div>
    {/* Hinge */}
    <div style={{
      height: "6px",
      background: "linear-gradient(180deg, #1c1c1c 0%, #2a2a2a 40%, #1a1a1a 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
    }}>
      <div style={{ width: "40px", height: "2px", borderRadius: "1px", background: "linear-gradient(90deg, #333, #444, #333)" }} />
    </div>
    {/* Keyboard base */}
    <div style={{
      height: "8px",
      background: "linear-gradient(180deg, #2a2a2a, #1a1a1a)",
      borderRadius: "0 0 6px 6px",
      marginLeft: "-10px", marginRight: "-10px",
      boxShadow: "0 3px 10px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.03)",
    }} />
  </div>
);

/* ─── Main Composition ─── */

const DeviceMockup = () => (
  <div
    className="device-mockup-wrapper"
    style={{
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
      gap: "8px",
    }}
  >
    {/* Laptop — sol-ön, monitörün önünde */}
    <div style={{
      position: "relative",
      zIndex: 2,
      marginRight: "-190px",
    }}>
      <Laptop />
    </div>

    {/* Monitor — sağ-arka */}
    <div style={{
      position: "relative",
      zIndex: 1,
      marginLeft: "20px",
    }}>
      <Monitor />
    </div>
  </div>
);

export default DeviceMockup;
