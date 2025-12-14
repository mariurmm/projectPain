import { useState, useEffect, useRef } from "react";
import { queryAI } from "../api/lmstudio";
import "../style/Chat.css";
import { useLanguage } from "../context/LanguageContext"; // ✅ добавлено

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const { language } = useLanguage(); // ✅ язык из контекста

  const t = {
    ru: {
      title: "Консультация с ИИ",
      placeholder: "Введите сообщение...",
      send: "Отправить",
      voiceStart: "Голос 🎤",
      voiceStop: "Остановить 🎤",
      error: "Ошибка сервера ИИ",
    },
    en: {
      title: "AI Consultation",
      placeholder: "Type a message...",
      send: "Send",
      voiceStart: "Voice 🎤",
      voiceStop: "Stop 🎤",
      error: "AI server error",
    },
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = language === "ru" ? "ru-RU" : "en-US"; // ✅ язык распознавания
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setText(transcript);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
  }, [language]);

  async function sendMessage() {
    if (!text.trim()) return;

    const newMsgs = [...messages, { text, isUser: true }];
    setMessages(newMsgs);
    setText("");

    try {
      const reply = await queryAI(text);
      setMessages([...newMsgs, { text: reply, isUser: false }]);
    } catch (err) {
      setMessages([...newMsgs, { text: t[language].error, isUser: false }]);
      console.error(err);
    }
  }

  function toggleListening() {
    if (!recognitionRef.current) return;
    if (!listening) {
      recognitionRef.current.start();
      setListening(true);
    } else {
      recognitionRef.current.stop();
      setListening(false);
    }
  }

  return (
    <div className="chat-wrapper">
      <h2>{t[language].title}</h2>

      <div className="chat-box">
        {messages.map((m, i) => (
          <div key={i} className={`message-row ${m.isUser ? "message-user" : "message-ai"}`}>
            <div className="message-bubble">{m.text}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-bar">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t[language].placeholder}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>{t[language].send}</button>
        <button onClick={toggleListening}>
          {listening ? t[language].voiceStop : t[language].voiceStart}
        </button>
      </div>
    </div>
  );
}
