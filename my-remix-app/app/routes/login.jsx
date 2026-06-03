// routes/exercises.jsx
import { json } from "@remix-run/node";
import axios from "axios";
import { authenticator } from "../server/auth.server"; // Đảm bảo đã khai báo authenticator
import { prisma } from "../server/db.server"; // Đảm bảo đã khai báo Prisma client
import { getSession, commitSession } from "../server/auth.server";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { redirect } from "@remix-run/node";
// Tạo loader để gọi ExerciseDB API và lấy dữ liệu
async function saveExercisesToDB(exercises) {
  try {
    for (const exercise of exercises) {
      exercise.difficulty = calculateDifficulty(exercise);
      exercise.time = calculateTime(exercise);
      exercise.intensity = calculateIntensity(exercise);
      exercise.healthConditions = calculateHealthConditions(exercise);
      // console.log(exercise.time);
      // console.log(exercise.difficulty);
      // console.log(exercise.intensity);
      // console.log(exercise.healthConditions);
      await prisma.exercise.upsert({
        where: { id: exercise.id }, // Dùng id làm điều kiện tìm kiếm
        update: {
          target: exercise.target,
          secondaryMuscles: exercise.secondaryMuscles,
          bodyPart: exercise.bodyPart,
          equipment: exercise.equipment,
          gifUrl: exercise.gifUrl,
          instructions: exercise.instructions,
          difficulty: exercise.difficulty,
          healthConditions: exercise.healthConditions,
          intensity: exercise.intensity,
          time: exercise.time,
        },
        create: {
          id: exercise.id, // Khi tạo mới bài tập, dùng id từ API
          name: exercise.name,
          target: exercise.target,
          secondaryMuscles: exercise.secondaryMuscles,
          bodyPart: exercise.bodyPart,
          equipment: exercise.equipment,
          gifUrl: exercise.gifUrl,
          instructions: exercise.instructions,
          difficulty: exercise.difficulty,
          healthConditions: exercise.healthConditions,
          intensity: exercise.intensity,
          time: exercise.time,
        },
      });
    }
    console.log("Exercises saved successfully");
  } catch (error) {
    console.error("Error saving exercises:", error);
  }
}
// Hàm tính toán độ khó dựa trên thiết bị và nhóm cơ
const calculateDifficulty = (exercise) => {
  const { equipment, bodyPart } = exercise;

  // Kiểm tra thiết bị để xác định độ khó
  if (
    equipment.includes("barbell") ||
    equipment.includes("kettlebell") ||
    equipment.includes("smith machine") ||
    equipment.includes("sled machine") ||
    equipment.includes("olympic barbell")
  ) {
    return "hard";
  }

  if (
    equipment.includes("dumbbell") ||
    equipment.includes("resistance band") ||
    equipment.includes("medicine ball") ||
    equipment.includes("band") ||
    equipment.includes("stability ball") ||
    equipment.includes("ez barbell") ||
    equipment.includes("trap bar")
  ) {
    return "medium";
  }

  if (
    equipment.includes("body weight") ||
    equipment.includes("roller") ||
    equipment.includes("bosu ball") ||
    equipment.includes("upper body ergometer") ||
    equipment.includes("stationary bike") ||
    equipment.includes("elliptical machine") ||
    equipment.includes("skierg machine")
  ) {
    return "easy";
  }

  // Kiểm tra nhóm cơ tác động để xác định độ khó
  if (
    bodyPart.includes("back") ||
    bodyPart.includes("upper legs") ||
    bodyPart.includes("chest")
  ) {
    return "hard";
  }

  if (bodyPart.includes("shoulders") || bodyPart.includes("upper arms")) {
    return "medium";
  }

  if (bodyPart.includes("lower arms") || bodyPart.includes("lower legs")) {
    return "easy";
  }

  // Nếu bài tập thuộc về cardio
  if (bodyPart.includes("cardio")) {
    return "medium"; // Các bài tập cardio có thể đa dạng từ mức độ trung bình đến cao
  }

  // Mặc định nếu không có trường hợp nào
  return "easy";
};

const calculateTime = (exercise) => {
  // Thời gian cơ bản cho mỗi bài tập
  let baseTime = 20; // Giới hạn thời gian mỗi bài tập là 20 phút

  // Thêm thời gian cho thiết bị (dựa trên loại thiết bị)
  if (
    exercise.equipment.includes("barbell") ||
    exercise.equipment.includes("kettlebell") ||
    exercise.equipment.includes("sled machine") ||
    exercise.equipment.includes("smith machine") ||
    exercise.equipment.includes("trap bar")
  ) {
    baseTime += 3; // Các thiết bị nặng yêu cầu nhiều thời gian hơn
  }
  if (
    exercise.equipment.includes("dumbbell") ||
    exercise.equipment.includes("cable") ||
    exercise.equipment.includes("medicine ball") ||
    exercise.equipment.includes("stability ball")
  ) {
    baseTime += 2; // Các thiết bị nhẹ yêu cầu ít thời gian hơn
  }

  // Thêm thời gian cho nhóm cơ lớn (legs, back, pectorals, glutes...)
  if (
    exercise.target.includes("legs") ||
    exercise.target.includes("back") ||
    exercise.target.includes("pectorals") ||
    exercise.target.includes("glutes") ||
    exercise.target.includes("quads")
  ) {
    baseTime += 2; // Nhóm cơ lớn yêu cầu nhiều thời gian hơn
  }

  // Giảm thời gian cho nhóm cơ nhỏ (biceps, triceps...)
  if (
    exercise.target.includes("biceps") ||
    exercise.target.includes("triceps") ||
    exercise.target.includes("forearms")
  ) {
    baseTime -= 1; // Nhóm cơ nhỏ sẽ tốn ít thời gian hơn
  }

  // Thêm thời gian cho độ khó (hard, medium, easy)
  if (exercise.difficulty === "hard") {
    baseTime += 3; // Độ khó cao sẽ thêm 3 phút
  } else if (exercise.difficulty === "medium") {
    baseTime += 2; // Độ khó trung bình sẽ thêm 2 phút
  }

  // Đảm bảo thời gian không vượt quá 20 phút
  // const totalTime = Math.min(baseTime, 20); // Giới hạn tổng thời gian hoàn thành mỗi bài tập không quá 20 phút

  // Trả về tổng thời gian (tính theo phút)
  return baseTime;
};

const calculateIntensity = (exercise) => {
  // Cường độ cao (high intensity)
  if (
    // Thiết bị mạnh mẽ và các nhóm cơ lớn
    exercise.equipment.includes("barbell") ||
    exercise.equipment.includes("kettlebell") ||
    exercise.equipment.includes("sled machine") ||
    exercise.equipment.includes("smith machine") ||
    exercise.equipment.includes("trap bar") ||
    exercise.equipment.includes("olympic barbell") ||
    exercise.target.includes("legs") || // nhóm cơ chân (quads, hamstrings)
    exercise.target.includes("back") || // nhóm cơ lưng (upper back, lats)
    exercise.target.includes("chest") // nhóm cơ ngực (pectorals)
  ) {
    return "high";
  }

  // Cường độ vừa phải (moderate intensity)
  if (
    // Thiết bị vừa phải và nhóm cơ vừa phải
    exercise.equipment.includes("dumbbell") ||
    exercise.equipment.includes("cable") ||
    exercise.equipment.includes("medicine ball") ||
    exercise.equipment.includes("resistance band") ||
    exercise.equipment.includes("band") ||
    exercise.target.includes("shoulders") || // nhóm cơ vai (delts)
    exercise.target.includes("biceps") || // nhóm cơ tay trước (biceps)
    exercise.target.includes("triceps") || // nhóm cơ tay sau (triceps)
    exercise.target.includes("forearms") // nhóm cơ cẳng tay (forearms)
  ) {
    return "moderate";
  }

  // Cường độ thấp (low intensity)
  return "low";
};

// const calculateHealthConditions = (exercise) => {
//   // Nếu sử dụng các thiết bị nặng (barbell, kettlebell) thì tình trạng sức khỏe là khỏe mạnh
//   if (
//     exercise.equipment.includes("barbell") ||
//     exercise.equipment.includes("kettlebell") ||
//     exercise.equipment.includes("trap bar") ||
//     exercise.equipment.includes("smith machine")
//   ) {
//     return "healthy";
//   }

//   // Nếu bài tập tác động đến các nhóm cơ như core (bụng) hoặc forearms (cẳng tay),
//   // hoặc sử dụng các thiết bị nhẹ như resistance band, thì tình trạng sức khỏe có thể là "weak or recovering"
//   if (
//     exercise.equipment.includes("resistance band") ||
//     exercise.target.includes("core") ||
//     exercise.target.includes("forearms")
//   ) {
//     return "weak or recovering";
//   }

//   // Mặc định, nếu không thuộc các trường hợp trên thì là "healthy"
//   return "healthy";
// };
const calculateHealthConditions = (exercise) => {
  // Tạo các mảng tình trạng sức khỏe dựa trên cường độ
  if (exercise.intensity === "high") {
    return ["very healthy"];
  }

  if (exercise.intensity === "moderate") {
    return ["normal health", "very healthy"];
  }

  if (exercise.intensity === "low") {
    return ["weak health", "very healthy", "normal health"];
  }

  // Mặc định nếu không xác định được cường độ, trả về một nhóm tình trạng chung chung
  return ["weak health", "very healthy", "normal health"];
};

// Loader kết hợp với mã xác thực người dùng và gọi API Exercisedb
export const loader = async ({ request }) => {
  const user = await authenticator.isAuthenticated(request);
  if (!user) {
    return json({ error: "User not authenticated" }, { status: 401 });
  }

  let existingUser = await prisma.user.findUnique({
    where: { email: user._json.email },
  });

  if (!existingUser) {
    existingUser = await prisma.user.create({
      data: {
        email: user._json.email,
        userName: user._json.name,
        picture: user._json.picture,
        isEmailVerified: user._json.email_verified,
      },
    });
  }

  const session = await getSession(request.headers.get("Cookie"));
  if (!session.get("userId")) {
    session.set("userId", existingUser.id);
  }
  const cookieHeader = await commitSession(session);

  try {
    const options = {
      method: "GET",
      url: "https://exercisedb.p.rapidapi.com/exercises",
      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
        "x-rapidapi-host": "exercisedb.p.rapidapi.com",
      },
      params: {
        limit: 1400,
      },
    };

    const response = await axios.request(options);
    const exercisesdb = response.data;

    await saveExercisesToDB(exercisesdb);

    // Chuyển hướng về trang home sau khi lưu xong dữ liệu
    return redirect("/home", {
      headers: {
        "Set-Cookie": cookieHeader,
      },
    });
  } catch (error) {
    console.error("Error fetching exercises:", error);

    return json(
      { error: "Error fetching exercises" },
      {
        headers: {
          "Set-Cookie": cookieHeader,
        },
      }
    );
  }
};
export default function login() {
  return <h1>improt data</h1>;
}
