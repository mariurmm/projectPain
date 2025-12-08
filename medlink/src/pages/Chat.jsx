import { useState } from "react";
import ChatMessage from "../components/ChatMessage";
import { analyzeMessage } from "../api/ai";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  async function send() {
    if (!text) return;

    const newMsgs = [...messages, { text, isUser: true }];
    setMessages(newMsgs);

    const ai = await analyzeMessage(text);

    setMessages([
      ...newMsgs,
      { text: ai.message, isUser: false }
    ]);

    setText("");
  }

  return (
    <div style={{ padding: 20 }}>
      <h3>Консультация</h3>

      <div style={{ height: "70vh", overflowY: "auto", border: "1px solid #ccc", padding: 10 }}>
        {messages.map((m, i) => (
          <ChatMessage key={i} text={m.text} isUser={m.isUser} />
        ))}
      </div>

      <div style={{ marginTop: 15 }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          style={{ width: "80%" }}
        />
        <button onClick={send}>Отправить</button>
      </div>
    </div>
  );
}
