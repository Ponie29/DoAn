// import các thư viện cần thiết
import { prisma } from "../server/db.server"; // Đảm bảo đã cấu hình Prisma Client
import { json } from "@remix-run/node"; // Dùng json để trả kết quả

// Hàm lưu bài tập vào cơ sở dữ liệu
async function saveExercisesToDB(exercises) {
  try {
    for (const exercise of exercises) {
      await prisma.exercise.upsert({
        where: { name: exercise.name }, // Kiểm tra xem bài tập đã tồn tại hay chưa
        update: {
          category: exercise.category,
          target: exercise.target,
          bodyPart: exercise.bodyPart,
          equipment: exercise.equipment,
          gifUrl: exercise.gifUrl,
          instructions: exercise.instructions,
        },
        create: {
          name: exercise.name,
          category: exercise.category,
          target: exercise.target,
          bodyPart: exercise.bodyPart,
          equipment: exercise.equipment,
          gifUrl: exercise.gifUrl,
          instructions: exercise.instructions,
        },
      });
    }
    console.log("Exercises saved successfully");
  } catch (error) {
    console.error("Error saving exercises:", error);
  }
}

// Hàm để lấy dữ liệu bài tập từ API Exercisedb và lưu vào DB
export const loader = async () => {
  const options = {
    method: "GET",
    headers: {
      "x-rapidapi-key": process.env.RAPIDAPI_KEY, // Key của bạn từ RapidAPI
      "x-rapidapi-host": "exercisedb.p.rapidapi.com", // Host của API
    },
  };

  try {
    // Gọi API từ phía server để lấy bài tập
    const response = await fetch(
      "https://exercisedb.p.rapidapi.com/exercises",
      options
    );

    if (!response.ok) {
      throw new Error("Error fetching exercises");
    }

    const exercises = await response.json();

    // Lưu bài tập vào cơ sở dữ liệu
    await saveExercisesToDB(exercises);

    // Trả về thành công
    return json({ message: "Exercises fetched and saved successfully!" });
  } catch (error) {
    console.error("Error fetching exercises:", error);
    return json(
      { error: "Failed to fetch and save exercises" },
      { status: 500 }
    );
  }
};

// Gọi loader trong route của bạn
