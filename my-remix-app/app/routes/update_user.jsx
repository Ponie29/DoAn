import { prisma } from "../server/db.server.js"; // Đảm bảo bạn đã import Prisma Client
import { redirect, json } from "@remix-run/node";

export const action = async ({ request }) => {
  const formData = await request.formData();

  console.log("Received form data:", formData); // Kiểm tra dữ liệu nhận được

  const userId = formData.get("userId");
  const email = formData.get("email");
  const userName = formData.get("userName");
  const isAdmin = formData.get("isAdmin") === "on";
  //   const rating = formData.get("rating");
  //   const url = formData.get("url");

  // Thực hiện cập nhật review trong cơ sở dữ liệu
  try {
    await prisma.User.update({
      where: { id: userId },
      data: {
        email: email,
        userName: userName,
        isAdmin: isAdmin,
      },
    });
    return json("update thanh cong");
  } catch (error) {
    console.error("Failed to update review:", error);
    return json({ error: "Failed to update review" }, { status: 500 });
  }
};
