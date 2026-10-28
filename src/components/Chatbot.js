import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { findBestAnswer, quickQuestions } from "../data/chatbotKnowledge";
import "./Chatbot.css";

const INITIAL_MESSAGES = [
  {
    id: 1,
    sender: "bot",
    text: "👋 Hi! I'm EduSphere Assistant. How can I help you today?",
    time: "Just now",
    actionLink: null,
    actionText: null
  }
];

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  const handleSend = (textToSend) => {
    const query = typeof textToSend === "string" ? textToSend : input;
    if (!query || !query.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: "user",
      text: query.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate natural thinking delay
    setTimeout(() => {
      const match = findBestAnswer(query);
      const botMsg = {
        id: Date.now() + 1,
        sender: "bot",
        text: match.answer,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actionLink: match.actionLink,
        actionText: match.actionText
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 450);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  return (
    <div className="chatbot-wrapper">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          className="chatbot-toggle-btn"
          onClick={() => setIsOpen(true)}
          aria-label="Open Chatbot"
        >
          <span className="chatbot-toggle-icon">💬</span>
          <span className="chatbot-toggle-text">Need Help?</span>
          <span className="chatbot-unread-dot"></span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">🤖</div>
              <div>
                <h4 className="chatbot-title">EduSphere Support</h4>
                <p className="chatbot-subtitle">
                  <span className="chatbot-status-indicator"></span> Always Active
                </p>
              </div>
            </div>
            <button
              className="chatbot-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close Chatbot"
            >
              ✕
            </button>
          </div>

          {/* Body / Messages */}
          <div className="chatbot-body">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-message-row ${msg.sender}`}>
                <div className={`chat-bubble ${msg.sender}`}>
                  {msg.text}
                  {msg.actionLink && (
                    <div>
                      <Link
                        to={msg.actionLink}
                        className="chat-action-btn"
                        onClick={() => setIsOpen(false)}
                      >
                        {msg.actionText || "Learn More"} →
                      </Link>
                    </div>
                  )}
                </div>
                <span className="chat-timestamp">{msg.time}</span>
              </div>
            ))}

            {isTyping && (
              <div className="chat-message-row bot">
                <div className="typing-indicator">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompt chips */}
          <div className="chatbot-quick-prompts">
            <span className="chatbot-quick-title">Quick Questions</span>
            <div className="chatbot-chips">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  className="chatbot-chip"
                  onClick={() => handleSend(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Input */}
          <div className="chatbot-footer">
            <form className="chatbot-input-form" onSubmit={handleSubmit}>
              <input
                type="text"
                className="chatbot-input"
                placeholder="Ask about courses, enrollment..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                type="submit"
                className="chatbot-send-btn"
                disabled={!input.trim()}
                aria-label="Send message"
              >
                ➤
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
