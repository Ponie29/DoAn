import { json } from "@remix-run/node";
import { prisma } from "../server/db.server.js"; // Đảm bảo đã khai báo Prisma client

export async function loader({ request }) {
  const url = new URL(request.url);
  const equipmentParam = url.searchParams.get("equipment");
  const intensityParam = url.searchParams.get("intensity");

  // Kiểm tra nếu thiếu thiết bị hoặc cường độ
  if (!equipmentParam) {
    return json({ error: "No equipment provided" }, { status: 400 });
  }
  if (!intensityParam) {
    return json({ error: "No intensity provided" }, { status: 400 });
  }

  // Chuyển đổi chuỗi thiết bị thành mảng
  const equipment = equipmentParam.split(",");

  try {
    // Thực hiện truy vấn lấy các target distinct từ bảng Exercise theo thiết bị và cường độ
    const muscleGroups = await prisma.exercise.findMany({
      where: {
        equipment: { in: equipment },
        intensity: intensityParam, // Điều kiện lọc thêm cho cường độ
      },
      select: {
        target: true,
        gifUrl: true,
      },
      distinct: ["target"],
    });

    // Kiểm tra nếu không có kết quả trả về
    if (!muscleGroups || muscleGroups.length === 0) {
      return json(
        {
          error: "No muscle groups found for selected equipment and intensity",
        },
        { status: 404 }
      );
    }

    // Trả về cả target và gifUrl
    const muscleOptions = muscleGroups.map((equip) => ({
      target: equip.target,
      gifUrl: equip.gifUrl,
    }));

    return json({ muscleOptions });
  } catch (error) {
    console.error("Error fetching muscle groups:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}
