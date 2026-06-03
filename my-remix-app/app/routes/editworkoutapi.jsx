// import { prisma } from "../server/db.server.js"; // Đảm bảo bạn đã có prisma được cấu hình đúng
// import { redirect } from "@remix-run/node"; // Để điều hướng lại sau khi chỉnh sửa

// export let action = async ({ request }) => {
//   const formData = new URLSearchParams(await request.text());

//   const actionType = formData.get("actionType");
//   const Id = formData.get("Id");
//   const time = formData.get("time");
//   const sets = formData.get("sets");
//   const reps = formData.get("reps");

//   // Kiểm tra actionType và chỉ xử lý edit khi actionType là 'edit'
//   if (actionType === "edit") {
//     try {
//       // Cập nhật bài tập trong cơ sở dữ liệu
//       await prisma.workoutPlan.update({
//         where: {
//           id: Number(Id),
//         },
//         data: {
//           time: Number(time),
//           sets: Number(sets),
//           reps: Number(reps),
//         },
//       });

//       // Redirect sau khi cập nhật thành công
//       return redirect("/Workout");
//     } catch (error) {
//       console.error("Error updating workout plan:", error);
//       return { error: "Có lỗi xảy ra khi cập nhật bài tập" };
//     }
//   }

//   return { error: "Action không hợp lệ" };
// };
import { prisma } from "../server/db.server.js"; // Đảm bảo bạn đã import Prisma Client
import { redirect, json } from "@remix-run/node";

export const action = async ({ request }) => {
  const formData = await request.formData();

  console.log("Received form data:", formData); // Kiểm tra dữ liệu nhận được

  const Id = formData.get("Id");
  const time = formData.get("time");
  const sets = formData.get("sets");
  const reps = formData.get("reps");

  // Thực hiện cập nhật review trong cơ sở dữ liệu
  try {
    await prisma.workoutPlan.update({
      where: {
        id: Number(Id),
      },
      data: {
        time: Number(time),
        sets: Number(sets),
        reps: Number(reps),
      },
    });
    return json("update thanh cong");
  } catch (error) {
    console.error("Failed to update review:", error);
    return json({ error: "Failed to update review" }, { status: 500 });
  }
};
