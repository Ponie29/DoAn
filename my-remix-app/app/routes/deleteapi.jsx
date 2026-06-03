import { json } from "@remix-run/node";
import { prisma } from "../server/db.server.js"; // Đường dẫn tuỳ thuộc vào dự án của bạn

export async function action({ request }) {
  try {
    const formData = await request.formData();
    const id = formData.get("Id");

    if (!id) {
      return json({ error: "ID không được cung cấp" }, { status: 400 });
    }

    // Xoá bài tập với ID được cung cấp
    await prisma.workoutPlan.delete({
      where: { id: parseInt(id, 10) }, // Chuyển đổi thành Int
    });

    return json({ success: true, message: "Bài tập đã được xoá thành công!" });
  } catch (error) {
    console.error("Lỗi khi xóa bài tập: ", error);
    return json({ error: "Xoá bài tập thất bại" }, { status: 500 });
  }
}
