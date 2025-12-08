import axios from "axios";

export async function analyzeMessage(text) {
  const res = await axios.post("/api/ai/analyze", { text });
  return res.data;
}
