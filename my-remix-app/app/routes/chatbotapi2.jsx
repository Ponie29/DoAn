import { useEffect } from "react";

const DifyChatbot = () => {
  useEffect(() => {
    // Cấu hình chatbot
    window.difyChatbotConfig = {
      token: "ObWjHAJvP8K9IS2L",
      inputs: {},
      systemVariables: {},
      userVariables: {},
    };

    // Tạo script Dify
    const script = document.createElement("script");
    script.src = "https://udify.app/embed.min.js";
    script.defer = true;
    script.id = "ObWjHAJvP8K9IS2L";
    document.body.appendChild(script);

    // 🔥 Inject CSS chỉnh icon + size
    const style = document.createElement("style");
    style.innerHTML = `
      /* Bubble button */
      #dify-chatbot-bubble-button {
        width: 70px !important;
        height: 70px !important;
        border-radius: 50% !important;
        background-color: #16a34a !important;
        box-shadow: 0 8px 20px rgba(0,0,0,0.25) !important;
      }

      /* Đổi icon */
      #dify-chatbot-bubble-button {
        background-image: url('/icon.png') !important;
        background-size: cover !important;
        background-position: center !important;
        background-repeat: no-repeat !important;
      }

      /* Ẩn icon mặc định */
      #dify-chatbot-bubble-button svg {
        display: none !important;
      }

      /* Resize cửa sổ chat */
      #dify-chatbot-bubble-window {
        width: 30rem !important;
        height: 45rem !important;
      }

      /* Responsive */
      @media (max-width: 640px) {
        #dify-chatbot-bubble-window {
          width: 95vw !important;
          height: 85vh !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  return null;
};

export default DifyChatbot;
