// app/routes/clear-storage.jsx

// import { useNavigate } from "@remix-run/react";

// export default function ClearStorage() {
//   const navigate = useNavigate();

//   useEffect(() => {
//     // Xóa các khóa cụ thể trong localStorage và sessionStorage của Coze
//     localStorage.clear();

//     console.log("Chat history cleared from localStorage and sessionStorage");

//     // Sau khi xóa, chuyển hướng về trang chủ hoặc trang khác
//     navigate("/", { replace: true });
//   }, [navigate]);

//   return <div>Clearing your data, please wait...</div>;
// }
import { useRef } from "react";
import { useEffect } from "react";

const CozeChatbot = () => {
  const clientRef = useRef(null); // Dùng ref để lưu trữ client

  useEffect(() => {
    // Chèn script từ Coze vào trang
    const script = document.createElement("script");
    script.src =
      "https://sf-cdn.coze.com/obj/unpkg-va/flow-platform/chat-app-sdk/1.0.0-beta.4/libs/oversea/index.js";
    script.async = true;

    script.onload = () => {
      // Khởi tạo WebChatClient và lưu vào ref
      clientRef.current = new window.CozeWebSDK.WebChatClient({
        config: {
          bot_id: "7437032318013095944", // Thay thế bằng bot ID của bạn
        },
        componentProps: {
          title: "Health Assistant", // Tiêu đề chatbot
        },
      });
    };

    document.body.appendChild(script); // Thêm script vào body

    return () => {
      document.body.removeChild(script); // Xóa script khi component bị unmount
      if (clientRef.current) {
        clientRef.current.destroy(); // Hủy client khi component bị unmount
      }
    };
  }, []);

  // Hàm hủy SDK khi cần
  const destroyCozeClient = () => {
    if (clientRef.current) {
      clientRef.current.destroy(); // Gọi destroy() trên client
      console.log("Coze Web SDK client destroyed");
      localStorage.removeItem("coze__ChatHistory__7437032318013095944"); // Dữ liệu chat của Coze
      console.log("Chat history cleared from localStorage");
    }
  };

  return (
    <div>
      <button onClick={destroyCozeClient}>Destroy Coze Web SDK</button>
    </div>
  );
};

export default CozeChatbot;
