export default function ChatMessage({ text, isUser }) {
  return (
    <div
      style={{
        textAlign: isUser ? "right" : "left",
        margin: "10px 0"
      }}
    >
      <div
        style={{
          display: "inline-block",
          padding: "10px 15px",
          borderRadius: 10,
          background: isUser ? "#DCF8C6" : "#EEE",
        }}
      >
        {text}
      </div>
    </div>
  );
}
