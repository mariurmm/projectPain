import { useState, useEffect, useRef } from "react";
import { queryAI } from "../api/lmstudio";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Прокрутка вниз при новых сообщениях
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Инициализация Web Speech API
  useEffect(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "ru-RU";
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
  }, []);

  async function sendMessage() {
    if (!text.trim()) return;

    // Добавляем сообщение пользователя
    const newMsgs = [...messages, { text, isUser: true }];
    setMessages(newMsgs);
    setText("");

    try {
      const reply = await queryAI(text);
      setMessages([...newMsgs, { text: reply, isUser: false }]);
    } catch (err) {
      setMessages([...newMsgs, { text: "Ошибка сервера ИИ", isUser: false }]);
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
    <div style={{ maxWidth: 600, margin: "20px auto", display: "flex", flexDirection: "column", height: "80vh" }}>
      <h2>Консультация с ИИ</h2>

      <div style={{ flex: 1, overflowY: "auto", border: "1px solid #ccc", padding: 10, borderRadius: 8 }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: m.isUser ? "flex-end" : "flex-start",
              margin: "8px 0"
            }}
          >
            <div
              style={{
                background: m.isUser ? "#DCF8C6" : "#EEE",
                padding: "10px 15px",
                borderRadius: 15,
                maxWidth: "70%"
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ display: "flex", marginTop: 10 }}>
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Введите сообщение..."
          style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage} style={{ marginLeft: 5, padding: "0 15px" }}>Отправить</button>
        <button onClick={toggleListening} style={{ marginLeft: 5, padding: "0 15px" }}>
          {listening ? "Остановить 🎤" : "Голос 🎤"}
        </button>
      </div>
    </div>
  );
}
