import axios from "axios";

export async function loadPatients() {
  const res = await axios.get("http://localhost:3000/api/patients");
  return res.data;
}
