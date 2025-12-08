import axios from "axios";

export async function loadPatients() {
  const res = await axios.get("/api/patients");
  return res.data;
}
