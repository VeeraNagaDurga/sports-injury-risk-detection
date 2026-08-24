import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { FaCommentDots, FaTimes, FaPaperPlane } from "react-icons/fa";
import api from "../api/api";
import "../styles/chat.css";

const WELCOME_MESSAGE = {
  role: "assistant",
  content:
    "Hi! I'm your SportsAI assistant. Ask me about your latest analysis, " +
    "risk scores, recommendations, or anything about how the platform works.",
};

// NEW. Only shown on these two pages - this is where a user would
// actually be looking at their own analysis data and have something
// meaningful to ask about. Everywhere else (Login, Register, Home,
// Profile, Upload, Admin) it stays hidden entirely.
const ALLOWED_PATHS = ["/dashboard", "/results"];

function ChatWidget() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const isLoggedIn = !!localStorage.getItem("access_token");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isAllowedPage = ALLOWED_PATHS.includes(location.pathname);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading]);

  // Hidden unless: logged in, NOT an Administrator, AND on /dashboard or
  // /results specifically. Server-side enforcement of the role check
  // still lives in routers/chat.py regardless of this UI-level gate.
  if (!isLoggedIn || currentUser.role === "Administrator" || !isAllowedPage) {
    return null;
  }

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const newUserMessage = { role: "user", content: trimmed };
    const history = messages.filter((m) => m !== WELCOME_MESSAGE);

    setMessages((prev) => [...prev, newUserMessage]);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.post("/chat", {
        message: trimmed,
        history: history,
      });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.data.reply },
      ]);
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        "Something went wrong reaching the AI assistant. Please try again.";
      setError(detail);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-widget">
      {isOpen && (
        <div className="chat-panel">
          <div className="chat-header">
            <span>SportsAI Assistant</span>
            <button
              className="chat-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <FaTimes />
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble chat-bubble-${m.role}`}>
                {m.content}
              </div>
            ))}
            {isLoading && (
              <div className="chat-bubble chat-bubble-assistant chat-typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
            {error && <div className="chat-error">{error}</div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-row">
            <textarea
              className="chat-input"
              placeholder="Ask about your results, risk score, or the platform..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              className="chat-send-btn"
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}

      <button
        className="chat-toggle-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? <FaTimes /> : <FaCommentDots />}
      </button>
    </div>
  );
}

export default ChatWidget;