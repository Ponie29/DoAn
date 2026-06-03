import { prisma } from "../server/db.server";
import { json, redirect } from "@remix-run/node";
import { getSession } from "../server/auth.server.js"; // Giả sử bạn có hàm để lấy session

export async function action({ request }) {
  const formData = new URLSearchParams(await request.text());
  const selectedExercises = JSON.parse(formData.get("selectedExercises"));

  // Lấy userId từ session
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");

  if (!userId) {
    return json({ error: "User not authenticated" }, { status: 401 });
  }

  try {
    // Lưu từng bài tập vào bảng WorkoutPlan
    for (let exercise of selectedExercises) {
      await prisma.workoutPlan.create({
        data: {
          workoutId: exercise.id,
          userId: userId, // Thêm userId vào đây
          exerciseName: exercise.name,
          time: !isNaN(exercise.time) ? parseInt(exercise.time, 10) : 0,
          sets: !isNaN(exercise.sets) ? parseInt(exercise.sets, 10) : 0,
          reps: !isNaN(exercise.reps) ? parseInt(exercise.reps, 10) : 0,
          days: exercise.days.join(", "),
        },
      });
    }

    return redirect("/Workout"); // Redirect đến trang thành công sau khi lưu
  } catch (error) {
    console.error("Error saving workout plan:", error);
    return json({ error: "Failed to save workout plan" }, { status: 500 });
  }
}
