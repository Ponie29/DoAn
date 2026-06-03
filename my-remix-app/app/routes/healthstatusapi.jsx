import { json, redirect } from "@remix-run/node";
import { prisma } from "../server/db.server";
import { getSession } from "../server/auth.server"; // Hàm lấy session của bạn

// Hàm để lấy userId từ session
async function getUserIdFromSession(request) {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  if (!userId) throw new Error("User not authenticated");
  return userId;
}

export async function action({ request }) {
  try {
    const formData = await request.formData();
    const userId = await getUserIdFromSession(request);

    // Chuyển đổi dữ liệu từ FormData sang các biến tương ứng
    const weight = parseFloat(formData.get("weight"));
    const height = parseFloat(formData.get("height"));
    const condition = formData.get("condition");
    const age = parseInt(formData.get("age"));
    const targetMuscleGroups = formData.getAll("targetMuscleGroups");
    const fitnessGoals = formData.get("fitnessGoals");
    const intensityPreference = formData.get("intensityPreference");
    const equipmentPreference = formData.getAll("equipmentPreference");
    const available_time = parseInt(formData.get("available_time"), 10);
    // console.log(weight);
    // console.log(height);
    // console.log(condition);
    // console.log(age);
    // console.log(targetMuscleGroups);
    // console.log(fitnessGoals);
    // console.log(intensityPreference);
    // console.log(equipmentPreference);
    // console.log(available_time);

    // Kiểm tra xem user đã có healthStatus chưa
    const existingHealthStatus = await prisma.healthStatus.findFirst({
      where: { userId },
    });

    // Nếu đã có healthStatus, thực hiện cập nhật
    if (existingHealthStatus) {
      await prisma.healthStatus.update({
        where: { id: existingHealthStatus.id },
        data: {
          weight,
          height,
          age,
          condition,
          targetMuscleGroups,
          fitnessGoals,
          intensityPreference,
          equipmentPreference,
          available_time,
        },
      });
    } else {
      // Nếu chưa có, thực hiện tạo mới
      await prisma.healthStatus.create({
        data: {
          userId,
          weight,
          height,
          condition,
          age,
          targetMuscleGroups,
          fitnessGoals,
          intensityPreference,
          equipmentPreference,
          available_time,
        },
      });
    }
    return json({ message: "Thông tin sức khỏe đã được lưu thành công." });
  } catch (error) {
    console.error("Lỗi khi lưu thông tin sức khỏe:", error);
    return json({ error: "Lỗi khi lưu thông tin sức khỏe" }, { status: 500 });
  }
}
