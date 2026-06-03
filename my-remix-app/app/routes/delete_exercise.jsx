import { prisma } from "../server/db.server";
import { redirect } from "@remix-run/node";
import { json } from "@remix-run/node";

export const action = async ({ request }) => {
  const formData = await request.formData();
  const exerciseId = formData.get("exerciseId");

  if (!exerciseId) {
    return new Response("Review ID is required", { status: 400 });
  }

  try {
    await prisma.Exercise.delete({
      where: { id: exerciseId }, // Chuyển đổi thành số nếu id là số
    });
    return json({ message: "Review deleted successfully" });
    // return redirect("/review_table"); // Hoặc redirect đến nơi bạn muốn
  } catch (error) {
    console.error("Error deleting review:", error);
    return new Response("Error deleting review", { status: 500 });
  }
};
