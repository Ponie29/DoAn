import { json } from "@remix-run/node";
import { prisma } from "../server/db.server"; // Kết nối với Prisma
import { getSession } from "../server/auth.server.js";

export const action = async ({ request }) => {
  try {
    // Lấy dữ liệu JSON từ request
    const { workoutId, timeSpent, status } = await request.json();

    const date = new Date().toISOString(); // Thêm thời gian hiện tại
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");

    // Kiểm tra lại các giá trị
    if (!userId) {
      return json({ error: "User not authenticated" }, { status: 401 });
    }

    if (!workoutId || !status || isNaN(timeSpent)) {
      return json({ error: "Invalid input data" }, { status: 400 });
    }

    // Kiểm tra sự tồn tại của workoutId và userId trong cơ sở dữ liệu
    const workoutExists = await prisma.exercise.findUnique({
      where: { id: workoutId },
    });

    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!workoutExists || !userExists) {
      return json({ error: "Invalid workoutId or userId" }, { status: 400 });
    }

    // Kiểm tra sự tồn tại của bản ghi UserProgress cho userId và workoutId
    const existingProgress = await prisma.userProgress.findFirst({
      where: {
        userId,
        workoutId,
      },
    });

    if (existingProgress) {
      // Nếu bản ghi tồn tại, cập nhật và cộng thêm thời gian vào tổng thời gian
      const totalTimeSpent = (existingProgress.timeSpent || 0) + timeSpent;

      await prisma.userProgress.update({
        where: { id: existingProgress.id },
        data: {
          timeSpent: totalTimeSpent, // Cộng dồn thời gian tập luyện
          status, // Cập nhật status
          date: new Date(date), // Cập nhật thời gian hiện tại
        },
      });
      return json({ message: "Progress updated" });
    } else {
      // Nếu bản ghi không tồn tại, tạo mới
      await prisma.userProgress.create({
        data: {
          workoutId,
          timeSpent,
          status,
          date: new Date(date),
          userId,
        },
      });
      return json({ message: "Progress saved" });
    }
  } catch (error) {
    console.error("Error saving progress:", error);
    return json({ error: "Error saving progress" }, { status: 500 });
  }
};
