import { prisma } from "../server/db.server.js"; // Đảm bảo bạn đã import Prisma Client
import { redirect, json } from "@remix-run/node";

export const action = async ({ request }) => {
  const formData = await request.formData();

  console.log("Received form data:", formData); // Kiểm tra dữ liệu nhận được

  const gifUrl = formData.get("gifUrl");
  const name = formData.get("name");
  const target = formData.get("target");
  const secondaryMusclesRaw = formData.get("secondaryMuscles");
  const bodyPart = formData.get("bodyPart");
  const equipment = formData.get("equipment");
  const difficulty = formData.get("difficulty");
  const timeRaw = formData.get("time");
  const intensity = formData.get("intensity");
  const healthConditionsRaw = formData.get("healthConditions");
  const instructionsRaw = formData.get("instructions");

  // Thực hiện cập nhật review trong cơ sở dữ liệu
  const secondaryMuscles = secondaryMusclesRaw
    ? secondaryMusclesRaw.split(",").map((muscle) => muscle.trim())
    : []; // Nếu null hoặc undefined, trả về mảng rỗng
  const time = timeRaw ? parseInt(timeRaw, 10) : null;
  const healthConditions = healthConditionsRaw
    ? healthConditionsRaw.split(",").map((muscle) => muscle.trim())
    : []; // Nếu null hoặc undefined, trả về mảng rỗng
  const instructions = instructionsRaw
    ? instructionsRaw.split(",").map((muscle) => muscle.trim())
    : []; // Nếu null hoặc undefined, trả về mảng rỗng
  try {
    await prisma.Exercise.create({
      data: {
        id: name,
        name: name,
        target: target,
        secondaryMuscles: secondaryMuscles,
        bodyPart: bodyPart,
        equipment: equipment,
        gifUrl: gifUrl,
        difficulty: difficulty,
        time: time,
        intensity: intensity,
        healthConditions: healthConditions,
        instructions: instructions,
      },
    });
    return json("update thanh cong");
  } catch (error) {
    console.error("Failed to update review:", error);
    return json({ error: "Failed to update review" }, { status: 500 });
  }
};
