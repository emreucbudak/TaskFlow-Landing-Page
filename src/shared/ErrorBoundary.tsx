import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean; error: Error | null };

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "24px",
            background: "#f8fcfb",
            fontFamily: "'Inter',sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: "480px",
              width: "100%",
              background: "#fff",
              borderRadius: "20px",
              border: "1px solid rgba(76,154,141,.2)",
              boxShadow: "0 20px 48px rgba(13,27,25,.08)",
              padding: "32px",
              textAlign: "center",
            }}
          >
            <h1 style={{ margin: "0 0 12px", color: "#0d1b19", fontSize: "1.5rem" }}>
              Bir hata oluştu
            </h1>
            <p style={{ margin: "0 0 20px", color: "rgba(13,27,25,.6)", fontSize: "14px", lineHeight: 1.6 }}>
              Sayfa yüklenirken beklenmeyen bir hata meydana geldi. Lütfen sayfayı yenileyin.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                height: "44px",
                padding: "0 24px",
                borderRadius: "12px",
                border: "none",
                background: "#13ecc8",
                color: "#0d1b19",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(19,236,200,.25)",
              }}
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
