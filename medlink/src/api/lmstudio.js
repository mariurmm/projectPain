import axios from "axios";

const BASE_URL = "http://26.108.80.85:1234";

export async function queryAI(prompt) {
  const res = await axios.post(`${BASE_URL}/v1/completions`, {
    model: "gemma-3-4b-it-qat",
    prompt,
    max_tokens: 200,
    temperature: 0.7
  });
  return res.data.choices[0].text;
}
