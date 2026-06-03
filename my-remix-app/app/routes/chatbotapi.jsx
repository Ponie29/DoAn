// // routes/chatbotapi.jsx
// import { json } from "@remix-run/node";
// import { SessionsClient } from "@google-cloud/dialogflow";

// export const action = async ({ request }) => {
//   const formData = await request.formData();
//   const prompt = formData.get("prompt");
//   const language = formData.get("language") || "en"; // Mặc định là "en" nếu không có ngôn ngữ

//   if (!prompt) {
//     return json({ error: "No prompt provided." }, { status: 400 });
//   }

//   try {
//     const sessionClient = new SessionsClient();
//     const projectId = process.env.Project_ID;
//     const sessionPath = sessionClient.projectAgentSessionPath(
//       projectId,
//       "unique-session-id"
//     );

//     const requestPayload = {
//       session: sessionPath,
//       queryInput: {
//         text: {
//           text: prompt,
//           languageCode: language, // Sử dụng ngôn ngữ được chọn từ frontend
//         },
//       },
//     };

//     const responses = await sessionClient.detectIntent(requestPayload);
//     const chatbotResponse = responses[0].queryResult.fulfillmentText;

//     return json({ response: chatbotResponse });
//   } catch (error) {
//     console.error("Dialogflow error:", error);
//     return json(
//       { error: "An error occurred while processing your request." },
//       { status: 500 }
//     );
//   }
// };
// routes/chatbotapi.jsx
import { json } from "@remix-run/node";
import { prisma } from "../server/db.server.js"; // Import prisma instance

export const action = async ({ request }) => {
  const { message, sender, userId } = await request.json();

  if (!message || !sender || !userId) {
    return json({ error: "Missing required fields." }, { status: 400 });
  }

  try {
    // Lưu tin nhắn vào cơ sở dữ liệu
    await prisma.message.create({
      data: {
        userId,
        sender,
        message,
      },
    });
    return json({ success: true });
  } catch (error) {
    console.error("Error saving message:", error);
    return json({ error: "Failed to save message." }, { status: 500 });
  }
};
