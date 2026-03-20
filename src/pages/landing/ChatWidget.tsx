import { useState, useEffect } from "react";
import Icon from "../../shared/components/Icon";
import { getApiBaseUrlCandidates, buildChatbotUrl, toRecord } from "../../shared/utils";
import { assistantWelcomeMessage } from "./constants";

type AssistantChatSource = {
  sourceKey: string;
  title: string;
  chunkIndex: number;
  score: number;
};

type AssistantChatApiResponse = {
  answer?: string;
  Answer?: string;
  sources?: unknown;
  Sources?: unknown;
  message?: string;
  detail?: string;
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  sources?: AssistantChatSource[];
  isError?: boolean;
};

const parseAssistantChatResponse = (payload: unknown) => {
  const record = toRecord(payload);
  const answerValue = record.answer ?? record.Answer;
  const answer = typeof answerValue === "string" ? answerValue.trim() : "";
  const rawSources = Array.isArray(record.sources)
    ? record.sources
    : Array.isArray(record.Sources)
      ? record.Sources
      : [];

  const sources = rawSources
    .map((item) => {
      const raw = toRecord(item);
      const sourceKeyValue = raw.sourceKey ?? raw.SourceKey ?? raw.source_key;
      const titleValue = raw.title ?? raw.Title;
      const chunkIndexValue = Number(raw.chunkIndex ?? raw.ChunkIndex ?? raw.chunk_index);
      const scoreValue = Number(raw.score ?? raw.Score);

      if (typeof sourceKeyValue !== "string" || typeof titleValue !== "string" || Number.isNaN(chunkIndexValue) || Number.isNaN(scoreValue)) {
        return null;
      }

      return {
        sourceKey: sourceKeyValue,
        title: titleValue,
        chunkIndex: chunkIndexValue,
        score: scoreValue,
      };
    })
    .filter((item): item is AssistantChatSource => item !== null);

  return { answer, sources };
};

type ChatWidgetProps = {
  dark: boolean;
  text: string;
  subText: string;
};

export default function ChatWidget({ dark, text, subText }: ChatWidgetProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", text: assistantWelcomeMessage },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  useEffect(() => {
    if (!chatOpen) return;
    const scrollContainer = document.getElementById("tf-chat-scroll");
    if (!scrollContainer) return;
    scrollContainer.scrollTop = scrollContainer.scrollHeight;
  }, [chatMessages, chatOpen]);

  const sendChatQuestion = async (rawQuestion: string) => {
    const question = rawQuestion.trim();
    if (!question || chatLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: question,
    };

    setChatMessages((current) => [...current, userMessage]);
    setChatInput("");
    setChatLoading(true);
    setChatError("");

    let lastError = "Şu anda bot yanıt veremedi. Lütfen tekrar deneyin.";

    for (const apiBaseUrl of getApiBaseUrlCandidates()) {
      try {
        const response = await fetch(buildChatbotUrl(apiBaseUrl), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question }),
        });

        const raw = await response.text();
        let payload: AssistantChatApiResponse | unknown = {};
        try {
          payload = JSON.parse(raw) as AssistantChatApiResponse;
        } catch {
          payload = {};
        }

        if (!response.ok) {
          const parsed = toRecord(payload);
          lastError = (typeof parsed.detail === "string" && parsed.detail.trim()) ||
            (typeof parsed.message === "string" && parsed.message.trim()) ||
            `Yanıt alınamadı (HTTP ${response.status}).`;
          continue;
        }

        const parsed = parseAssistantChatResponse(payload);
        if (!parsed.answer) {
          lastError = "Bot yanıtı boş döndü.";
          continue;
        }

        setChatMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: parsed.answer,
            sources: parsed.sources,
          },
        ]);
        setChatLoading(false);
        return;
      } catch {
        lastError = "API'ye ulaşılamadı.";
      }
    }

    setChatMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text: lastError,
        isError: true,
      },
    ]);
    setChatError(lastError);
    setChatLoading(false);
  };

  const handleChatSubmit = async (event?: { preventDefault: () => void }) => {
    event?.preventDefault();
    await sendChatQuestion(chatInput);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setChatOpen((current) => !current)}
        aria-label={chatOpen ? "Sohbet penceresini kapat" : "TFBot sohbetini aç"}
        style={{
          position: "fixed", right: "20px", bottom: "20px", zIndex: 1000,
          width: "56px", height: "56px", borderRadius: "18px",
          background: "linear-gradient(135deg, #13ecc8 0%, #4c9a8d 100%)",
          color: "#0d1b19",
          border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 12px 28px rgba(19,236,200,.28), 0 4px 12px rgba(0,0,0,.2)", fontSize: "24px",
          transform: chatOpen ? "scale(1.02)" : "scale(1)",
        }}
      >
        <Icon name={chatOpen ? "close" : "chat_bubble"} style={{ fontSize: "24px" }} />
      </button>

      {chatOpen && (
        <div style={{
          position: "fixed",
          right: "20px",
          bottom: "88px",
          zIndex: 1000,
          width: "min(380px, calc(100vw - 24px))",
          height: "min(560px, calc(100vh - 120px))",
          borderRadius: "24px",
          border: `1px solid ${dark ? "rgba(76,154,141,.25)" : "rgba(76,154,141,.18)"}`,
          background: dark ? "rgba(9,21,19,.96)" : "rgba(255,255,255,.98)",
          boxShadow: dark ? "0 28px 70px rgba(0,0,0,.45)" : "0 28px 70px rgba(13,27,25,.18)",
          backdropFilter: "blur(20px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            borderBottom: `1px solid ${dark ? "rgba(255,255,255,.06)" : "rgba(13,27,25,.08)"}`,
            background: dark ? "linear-gradient(180deg, rgba(19,236,200,.08), transparent)" : "linear-gradient(180deg, rgba(19,236,200,.1), transparent)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "40px", height: "40px", borderRadius: "14px",
                background: "linear-gradient(135deg, #13ecc8 0%, #4c9a8d 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#0d1b19", boxShadow: "0 10px 20px rgba(19,236,200,.22)",
              }}>
                <Icon name="smart_toy" style={{ fontSize: "22px" }} />
              </div>
              <div>
                <div style={{ fontSize: "15px", fontWeight: 800, color: text, lineHeight: 1.1 }}>TFBot</div>
                <div style={{ fontSize: "12px", color: subText, marginTop: "3px" }}>TaskFlow yardım asistanı</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setChatOpen(false)}
              aria-label="Sohbeti kapat"
              style={{
                width: "34px", height: "34px", borderRadius: "10px",
                border: "none", background: dark ? "rgba(255,255,255,.04)" : "rgba(13,27,25,.05)",
                color: text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Icon name="close" style={{ fontSize: "18px" }} />
            </button>
          </div>

          <div
            id="tf-chat-scroll"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              background: dark
                ? "radial-gradient(circle at top, rgba(19,236,200,.08), transparent 38%), linear-gradient(180deg, rgba(9,21,19,.98), rgba(9,21,19,.92))"
                : "linear-gradient(180deg, rgba(248,252,251,.98), rgba(255,255,255,.98))",
            }}
          >
            {chatMessages.map((message) => {
              const isUser = message.role === "user";
              return (
                <div
                  key={message.id}
                  style={{
                    maxWidth: "84%",
                    alignSelf: isUser ? "flex-end" : "flex-start",
                    borderRadius: "18px",
                    padding: "12px 14px",
                    background: isUser
                      ? "linear-gradient(135deg, #13ecc8 0%, #4c9a8d 100%)"
                      : dark
                        ? "rgba(255,255,255,.06)"
                        : "rgba(13,27,25,.05)",
                    color: isUser ? "#0d1b19" : text,
                    border: isUser ? "none" : `1px solid ${dark ? "rgba(255,255,255,.06)" : "rgba(13,27,25,.08)"}`,
                    boxShadow: isUser ? "0 10px 20px rgba(19,236,200,.16)" : "none",
                  }}
                >
                  <div style={{ fontSize: "13px", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{message.text}</div>
                  {message.isError && (
                    <div style={{ marginTop: "8px", fontSize: "11px", color: dark ? "#fca5a5" : "#b91c1c" }}>
                      Lütfen biraz sonra tekrar deneyin.
                    </div>
                  )}
                </div>
              );
            })}

            {chatLoading && (
              <div style={{
                maxWidth: "84%",
                alignSelf: "flex-start",
                borderRadius: "18px",
                padding: "12px 14px",
                background: dark ? "rgba(255,255,255,.06)" : "rgba(13,27,25,.05)",
                border: `1px solid ${dark ? "rgba(255,255,255,.06)" : "rgba(13,27,25,.08)"}`,
                color: subText,
              }}>
                <div style={{ fontSize: "13px" }}>TFBot yazıyor...</div>
              </div>
            )}
          </div>

          <div style={{
            padding: "14px",
            borderTop: `1px solid ${dark ? "rgba(255,255,255,.06)" : "rgba(13,27,25,.08)"}`,
            background: dark ? "rgba(9,21,19,.98)" : "rgba(255,255,255,.98)",
          }}>
            {chatError && (
              <div style={{
                marginBottom: "10px",
                fontSize: "12px",
                color: dark ? "#fca5a5" : "#b91c1c",
              }}>
                {chatError}
              </div>
            )}
            <form onSubmit={handleChatSubmit} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="text"
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Sorunuzu yazın..."
                autoComplete="off"
                autoFocus
                style={{
                  flex: 1,
                  height: "48px",
                  borderRadius: "14px",
                  border: `1px solid ${dark ? "rgba(255,255,255,.08)" : "rgba(13,27,25,.12)"}`,
                  background: dark ? "rgba(255,255,255,.04)" : "#fff",
                  color: text,
                  padding: "0 14px",
                  outline: "none",
                  fontSize: "14px",
                }}
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                style={{
                  height: "48px",
                  minWidth: "88px",
                  padding: "0 16px",
                  borderRadius: "14px",
                  border: "none",
                  cursor: chatLoading || !chatInput.trim() ? "not-allowed" : "pointer",
                  background: "#13ecc8",
                  color: "#0d1b19",
                  fontWeight: 800,
                  fontSize: "14px",
                  boxShadow: "0 8px 18px rgba(19,236,200,.22)",
                  opacity: chatLoading || !chatInput.trim() ? 0.65 : 1,
                }}
              >
                Gönder
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
