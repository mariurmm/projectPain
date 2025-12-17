import axios from "axios";

const BASE_URL = "http://127.0.0.1:1234";

export async function queryAI(prompt) {
  const res = await axios.post(`http://localhost:3000/api/chat`, {
    message: prompt
  });
  console.log("AI RESPONSE FULL:", res.data);
  console.log("AI RESPONSE:", res.data);
  return res.data.aiResponse;
}
