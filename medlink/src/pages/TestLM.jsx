import { useEffect } from "react";

export default function TestLM() {
  useEffect(() => {
    fetch("http://26.108.80.85:1234/v1/models")
      .then(res => res.json())
      .then(data => console.log("LM Studio models:", data))
      .catch(err => console.error("Ошибка запроса:", err));
  }, []);

  return <div>Проверка LM Studio... Открой консоль браузера</div>;
}
