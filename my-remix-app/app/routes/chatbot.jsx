// routes/chatbot.jsx
import { useState } from "react";
import { useEffect } from "react";
import "../styles/chatbot.css";

import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getSession } from "../server/auth.server.js";
import Clearchat from "../routes/clearchatdata.jsx";

export const loader = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");

  if (!userId) {
    return json({ error: "User not authenticated" }, { status: 401 });
  }

  return json({ userId });
};
export default function Chatbot() {
  const { userId } = useLoaderData();
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [language, setLanguage] = useState("en"); // Thêm state cho ngôn ngữ

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("prompt", prompt);
    formData.append("language", language); // Gửi thông tin ngôn ngữ

    try {
      const res = await fetch("/chatbotapi", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setResponse(data.response || "No response from chatbot.");
    } catch (error) {
      console.error("Error submitting prompt:", error);
      setResponse("An error occurred.");
    }
  };

  return (
    <div className="chat-container">
      <h1>Dialogflow Chatbot</h1>
      <div className="chat-box">
        {/* Tin nhắn người dùng */}
        <div className="user-message">{prompt}</div>

        {/* Tin nhắn chatbot */}
        {response && <div className="bot-message">{response}</div>}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask something..."
        />
        <select onChange={(e) => setLanguage(e.target.value)} value={language}>
          <option value="en">English</option>
          <option value="vi">Vietnamese</option>
        </select>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}
