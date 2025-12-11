import axios from "axios";

const BASE_URL = "http://26.108.80.85:1234";

export async function queryAI(prompt) {
  const res = await axios.post(`http://localhost:3000/api/chat`, {
    prompt: prompt
  });
  return res.data.reply;
}
