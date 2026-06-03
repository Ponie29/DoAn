import { json } from "@remix-run/node";
import { prisma } from "../server/db.server";
import { getSession } from "../server/auth.server.js";
import { useLoaderData } from "@remix-run/react";
import { useMemo } from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { authenticator } from "../server/auth.server";
import { Toaster, toast } from "sonner";
import {
  Tooltip as TooltipNextui,
  Button,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownSection,
  Avatar,
} from "@nextui-org/react";
import { useFetcher, useNavigate } from "@remix-run/react";
import { Link } from "@remix-run/react";
import "../styles/stats.css";
import { Accordion, AccordionItem } from "@nextui-org/react";
async function getRecommendedExercises(healthStatus, evaluation) {
  const {
    intensityPreference,
    available_time,
    targetMuscleGroups,
    equipmentPreference,
    condition,
  } = healthStatus;

  const healthConditions = Array.isArray(condition) ? condition : [condition];

  // 1️⃣ Điều chỉnh cường độ dựa trên hiệu suất
  let intensityLevel;
  if (evaluation.performance === "Needs Improvement") {
    intensityLevel =
      evaluation.intensity === "Low Intensity" ? "moderate" : "low";
  } else {
    intensityLevel =
      evaluation.intensity === "High Intensity"
        ? "high"
        : evaluation.intensity === "Moderate Intensity"
        ? "moderate"
        : "low";
  }

  // 2️⃣ Điều chỉnh thời gian bài tập dựa trên hiệu suất
  const recommendedTime =
    evaluation.performance === "Needs Improvement"
      ? Math.min((available_time || 60) + 10, 90) // Tăng 10 phút nếu cần cải thiện, tối đa 90 phút
      : available_time || 60;

  // 3️⃣ Truy vấn danh sách bài tập phù hợp (tối đa 15 bài)
  let exercises = await prisma.exercise.findMany({
    where: {
      intensity: intensityLevel,
      time: { lte: recommendedTime },

      ...(targetMuscleGroups.length > 0 && {
        OR: targetMuscleGroups.map((muscle) => ({
          target: muscle,
        })),
      }),

      ...(equipmentPreference.length > 0 && {
        OR: equipmentPreference.map((equip) => ({
          equipment: equip,
        })),
      }),

      ...(healthConditions.length > 0 && {
        NOT: { healthConditions: { hasSome: healthConditions } },
      }),
    },
    orderBy: { difficulty: "asc" }, // Sắp xếp từ dễ đến khó
    take: 15, // Giới hạn tối đa 15 bài tập
  });

  // 4️⃣ Nếu không đủ bài tập, thử giảm cường độ xuống mức thấp hơn
  if (exercises.length < 10) {
    const alternativeIntensity = intensityLevel === "high" ? "moderate" : "low";

    const additionalExercises = await prisma.exercise.findMany({
      where: {
        intensity: alternativeIntensity,
        time: { lte: recommendedTime },
      },
      orderBy: { difficulty: "asc" },
      take: 15 - exercises.length, // Bổ sung số bài còn thiếu
    });

    exercises = [...exercises, ...additionalExercises];
  }

  // 5️⃣ Nếu vẫn chưa đủ, loại bỏ bộ lọc dụng cụ và tìm thêm bài tập
  if (exercises.length < 10) {
    const additionalExercises = await prisma.exercise.findMany({
      where: {
        intensity: intensityLevel,
        time: { lte: recommendedTime },
      },
      orderBy: { difficulty: "asc" },
      take: 15 - exercises.length,
    });

    exercises = [...exercises, ...additionalExercises];
  }

  return exercises;
}

const generatePersonalizedFeedback = (performanceEvaluation, fitnessGoals) => {
  if (
    !performanceEvaluation ||
    !performanceEvaluation.weekly ||
    !performanceEvaluation.monthly
  ) {
    return {
      weeklyFeedback:
        "Not enough data to evaluate weekly performance. Try to be more consistent!",
      weeklyRecommendations: [
        "Stay active and aim for regular workouts to track your progress effectively.",
      ],
      monthlyFeedback:
        "Not enough data to evaluate monthly performance. Stay consistent!",
      monthlyRecommendations: [
        "Consistency is key! Keep up with your workouts to see long-term progress.",
      ],
    };
  }

  const { weekly, monthly } = performanceEvaluation;
  let weeklyFeedback = [];
  let weeklyRecommendations = [];
  let monthlyFeedback = [];
  let monthlyRecommendations = [];

  // 📌 Weekly Performance Evaluation (7 Days)
  if (weekly.performance === "Needs Improvement") {
    weeklyFeedback.push(
      "Your weekly performance needs improvement. Let's refine your workout plan!"
    );
    weeklyRecommendations.push(
      "Try to establish a consistent workout routine that aligns with your fitness goals.",
      "If maintaining consistency is a challenge, start with small, manageable sessions and gradually increase intensity."
    );
  } else if (weekly.performance === "Moderate Performance") {
    weeklyFeedback.push(
      "You're maintaining a moderate performance. Keep pushing for better results!"
    );
    weeklyRecommendations.push(
      "Consider gradually increasing workout intensity or duration to see greater improvements.",
      "Listen to your body and adjust training levels accordingly."
    );
  } else {
    weeklyFeedback.push("Great job! Your weekly performance is excellent.");
    weeklyRecommendations.push(
      "Maintain your current momentum. If you want to challenge yourself, try incorporating more diverse exercises."
    );
  }

  // 📌 Monthly Performance Evaluation (30 Days)
  if (monthly.performance === "Needs Improvement") {
    monthlyFeedback.push("Your monthly performance is below expectations.");
    monthlyRecommendations.push(
      "Review factors that may have affected your consistency, such as schedule conflicts or motivation levels.",
      "Consider setting smaller, more achievable goals to build momentum."
    );
  } else if (monthly.performance === "Moderate Performance") {
    monthlyFeedback.push(
      "You're maintaining a stable workout routine, but there's room for improvement."
    );
    monthlyRecommendations.push(
      "Try introducing variation in your workouts to keep them engaging and avoid plateaus.",
      "Monitor your workout trends to ensure you are making progress over time."
    );
  } else {
    monthlyFeedback.push(
      "Fantastic! You've maintained strong performance throughout the month."
    );
    monthlyRecommendations.push(
      "Keep up your current routine. If you're looking to advance further, experiment with increased intensity or new training techniques."
    );
  }

  // 📌 Frequency Assessment (Weekly)
  if (weekly.frequency === "Does Not Meet Goal") {
    weeklyRecommendations.push(
      "You're not meeting the recommended workout frequency. Try adding at least 1-2 extra sessions per week."
    );
  } else if (weekly.frequency === "Overtraining Risk") {
    weeklyRecommendations.push(
      "You may be overtraining! Ensure you have adequate rest days to prevent burnout and injury."
    );
  }

  // 📌 Intensity Assessment (Weekly)
  if (weekly.intensity === "Low Intensity") {
    weeklyRecommendations.push(
      "Your workout intensity seems low. Try increasing your workout duration or adding more challenging exercises."
    );
  } else if (weekly.intensity === "High Intensity") {
    weeklyRecommendations.push(
      "You're training at a high intensity. Make sure to incorporate sufficient rest and recovery."
    );
  }

  // 📌 Time Efficiency (Weekly)
  if (weekly.timeEvaluation.includes("Exceeds")) {
    weeklyRecommendations.push(
      "You're exceeding your available workout time. If it's feeling overwhelming, consider adjusting your schedule for better balance."
    );
  }

  // 📌 Goal-Specific Recommendations (Applicable to both Weekly & Monthly)
  let goalRecommendations = [];
  if (fitnessGoals) {
    if (fitnessGoals === "muscle gain") {
      goalRecommendations.push(
        "Focus on progressive overload with strength training exercises.",
        "Ensure adequate protein intake and maintain a calorie surplus for muscle growth."
      );
    } else if (fitnessGoals === "fat loss") {
      goalRecommendations.push(
        "Incorporate a mix of strength training and cardio to maximize fat loss.",
        "Maintain a consistent calorie deficit and prioritize high-protein meals."
      );
    } else if (fitnessGoals === "recovery") {
      goalRecommendations.push(
        "Prioritize rest, hydration, and proper nutrition to enhance muscle recovery.",
        "Consider incorporating mobility work, stretching, and active recovery sessions."
      );
    } else if (fitnessGoals === "endurance") {
      goalRecommendations.push(
        "Gradually increase your cardio sessions to build endurance effectively.",
        "Vary your workouts with interval training and cross-training to improve stamina."
      );
    }
  }

  // 📌 Final Output
  return {
    weeklyFeedback: weeklyFeedback.join(" "),
    weeklyRecommendations,
    monthlyFeedback: monthlyFeedback.join(" "),
    monthlyRecommendations,
    goalRecommendations,
  };
};

// Hàm loader để lấy dữ liệu thống kê
export const loader = async ({ request }) => {
  try {
    const user = await authenticator.isAuthenticated(request);
    if (!user) {
      return json({ error: "User not authenticated" }, { status: 401 });
    } // Giả sử có hàm lấy userId từ session

    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");

    if (!userId) {
      return json({ error: "User not authenticated" }, { status: 401 });
    }

    // Lấy dữ liệu bài tập theo userId
    const userProgress = await prisma.userProgress.findMany({
      where: { userId },
      include: { exercise: true }, // Lấy cả thông tin bài tập liên quan
      orderBy: { date: "desc" },
    });
    const healthStatus = await prisma.healthStatus.findFirst({
      where: { userId },
    });

    if (!healthStatus) {
      console.error(`No health status found for userId: ${userId}`);
      return json(
        { error: "No health status found for the user" },
        { status: 404 }
      );
    }

    // Nhóm dữ liệu theo ngày
    const progressByDate = userProgress.reduce((acc, progress) => {
      const date = progress.date.toISOString().split("T")[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(progress);
      return acc;
    }, {});

    // Tổng hợp dữ liệu thống kê
    const dailyStats = Object.keys(progressByDate).map((date) => {
      const dayProgress = progressByDate[date];
      const totalTimeSpent = dayProgress.reduce(
        (total, progress) => total + (progress.timeSpent || 0),
        0
      );

      const completedCount = dayProgress.filter(
        (p) => p.status === "completed"
      ).length;

      return {
        date,
        totalTimeSpent: parseFloat((totalTimeSpent / 3600).toFixed(2)), // Đổi sang giờ
        completedCount,
        exercises: dayProgress,
      };
    });

    const evaluatePerformance = (dailyStats, healthStatus) => {
      if (!dailyStats || !Array.isArray(dailyStats)) {
        console.error(
          "❌ dailyStats is undefined or not an array:",
          dailyStats
        );
        return { error: "Invalid data format" };
      }

      const now = new Date();

      // ✅ Hàm lấy đủ N ngày gần nhất, kể cả ngày không có bản ghi
      const getLastNDaysStats = (days) => {
        let result = [];
        for (let i = days - 1; i >= 0; i--) {
          let date = new Date(now);
          date.setDate(now.getDate() - i);
          let formattedDate = date.toISOString().split("T")[0];

          let stat = dailyStats.find((s) => s.date === formattedDate);
          result.push(
            stat || {
              date: formattedDate,
              totalTimeSpent: 0,
              completedCount: 0,
              exercises: [],
            }
          );
        }
        return result;
      };

      // ✅ Luôn lấy đủ 7 và 30 ngày (kể cả ngày nghỉ)
      const last7Days = getLastNDaysStats(7);
      const last30Days = getLastNDaysStats(30);

      console.log("📊 last7Days:", last7Days);
      console.log("📊 last30Days:", last30Days);

      // ✅ Nếu 7 ngày gần nhất đều không có tập luyện → Không đánh giá tuần
      if (last7Days.every((s) => s.totalTimeSpent === 0)) {
        return {
          weekly: "Not enough data for evaluation",
          monthly: last30Days.every((s) => s.totalTimeSpent === 0)
            ? "Not enough data for evaluation"
            : null,
        };
      }

      // ✅ Nếu 30 ngày gần nhất đều không có tập luyện → Không đánh giá tháng
      if (last30Days.every((s) => s.totalTimeSpent === 0)) {
        return {
          weekly: evaluateWeeklyPerformance(last7Days, healthStatus),
          monthly: "Not enough data for evaluation",
        };
      }

      // ✅ Nếu có dữ liệu hợp lệ, đánh giá bình thường
      return {
        weekly: evaluateWeeklyPerformance(last7Days, healthStatus),
        monthly: evaluateMonthlyPerformance(last30Days, healthStatus),
      };
    };

    // Weekly performance evaluation
    const evaluateWeeklyPerformance = (stats, healthStatus) => {
      if (!healthStatus) {
        console.error("Health status is undefined");
        return {
          performance: "No data available",
          frequency: "No data available",
          intensity: "No data available",
          timeEvaluation: "No data available",
        };
      }

      const { fitnessGoals, intensityPreference, available_time } =
        healthStatus;

      let totalDays = stats.filter((s) => s.totalTimeSpent > 0).length; // Số ngày có tập luyện
      let totalTimeSpent = stats.reduce(
        (total, stat) => total + stat.totalTimeSpent,
        0
      );
      let averageTimeSpent = totalDays > 0 ? totalTimeSpent / totalDays : 0;

      let frequencyEvaluation = "";
      let intensity = "";
      let timeEvaluation = "";
      let overallPerformance = "";

      // Đặt ngưỡng tần suất tập luyện theo mục tiêu
      let targetFrequency;
      switch (fitnessGoals.toLowerCase()) {
        case "muscle gain":
          targetFrequency = { min: 3, max: 5 };
          break;
        case "fat loss":
          targetFrequency = { min: 4, max: 6 };
          break;
        case "recovery":
          targetFrequency = { min: 2, max: 3 };
          break;
        case "endurance":
          targetFrequency = { min: 3, max: 5 };
          break;
        default:
          targetFrequency = { min: 2, max: 3 };
      }

      // Đánh giá tần suất tập luyện
      if (totalDays > targetFrequency.max) {
        frequencyEvaluation = "Overtraining Risk";
      } else if (totalDays >= targetFrequency.min) {
        frequencyEvaluation = "Meets Goal";
      } else {
        frequencyEvaluation = "Does Not Meet Goal";
      }

      // Đánh giá cường độ tập luyện
      if (intensityPreference === "Low") {
        intensity =
          averageTimeSpent >= 1 ? "Moderate Intensity" : "Low Intensity";
      } else if (intensityPreference === "High") {
        intensity =
          averageTimeSpent > 1.5 ? "High Intensity" : "Moderate Intensity";
      } else {
        intensity =
          averageTimeSpent > 1.5
            ? "High Intensity"
            : averageTimeSpent >= 1
            ? "Moderate Intensity"
            : "Low Intensity";
      }

      // Đánh giá thời gian tập luyện so với thời gian rảnh
      if (available_time && averageTimeSpent * 60 > available_time) {
        timeEvaluation =
          "Exceeds Available Time - Consider Adjusting Workout Plan";
      } else {
        timeEvaluation = "Matches Available Time";
      }

      // Đánh giá tổng thể
      if (
        frequencyEvaluation === "Meets Goal" &&
        intensity !== "Low Intensity"
      ) {
        overallPerformance = timeEvaluation.includes("Exceeds")
          ? "Good Performance (Consider Adjusting Time)"
          : "Good Performance";
      } else if (frequencyEvaluation === "Does Not Meet Goal") {
        overallPerformance = "Needs Improvement";
      } else {
        overallPerformance = "Moderate Performance";
      }

      return {
        performance: overallPerformance,
        frequency: frequencyEvaluation,
        intensity,
        timeEvaluation,
      };
    };

    // Monthly performance evaluation
    const evaluateMonthlyPerformance = (stats, healthStatus) => {
      if (!healthStatus) {
        console.error("Health status is undefined");
        return {
          performance: "No data available",
          consistency: "No data available",
          intensity: "No data available",
          timeTrend: "No data available",
          timeEvaluation: "No data available",
        };
      }

      const { fitnessGoals, intensityPreference, available_time } =
        healthStatus;

      // Chia dữ liệu thành 4 tuần
      const weeks = [[], [], [], []]; // Mỗi phần tử là 1 tuần
      stats.forEach((stat, index) => {
        const weekIndex = Math.floor(index / 7);
        if (weekIndex < 4) {
          weeks[weekIndex].push(stat);
        }
      });

      // Kiểm tra số ngày tập trong từng tuần
      const weeklyCounts = weeks.map((week) => week.length);

      // Kiểm tra sự nhất quán: tập đủ số ngày trong mỗi tuần
      let consistentWeeks = weeklyCounts.filter(
        (days) => days >= 3 // Yêu cầu tập ít nhất 3 ngày/tuần để coi là đều đặn
      ).length;
      let consistency = consistentWeeks >= 3 ? "Consistent" : "Inconsistent";

      // Tổng thời gian tập luyện trong 30 ngày
      let totalTimeSpent = stats.reduce(
        (total, stat) => total + stat.totalTimeSpent,
        0
      );
      let averageTimeSpent = totalTimeSpent / stats.length;

      // Tính xu hướng thời gian tập luyện
      const weekTimeSums = weeks.map((week) =>
        week.reduce((total, stat) => total + stat.totalTimeSpent, 0)
      );
      let timeTrend;
      if (
        weekTimeSums[3] > weekTimeSums[2] &&
        weekTimeSums[2] > weekTimeSums[1]
      ) {
        timeTrend = "Increasing";
      } else if (
        weekTimeSums[3] < weekTimeSums[2] &&
        weekTimeSums[2] < weekTimeSums[1]
      ) {
        timeTrend = "Decreasing";
      } else {
        timeTrend = "Stable";
      }

      // Đánh giá tổng thời gian tập luyện
      let performance =
        totalTimeSpent >= 30 * 60 * 60 // Tổng thời gian >= 30 giờ
          ? "Good Performance"
          : "Needs Improvement";

      // Đánh giá cường độ tập luyện
      let intensity =
        averageTimeSpent > 1.5
          ? "High Intensity"
          : averageTimeSpent >= 1
          ? "Moderate Intensity"
          : "Low Intensity";

      // So sánh với thời gian rảnh của người dùng
      let timeEvaluation =
        available_time && averageTimeSpent * 60 <= available_time
          ? "Matches Available Time"
          : "Exceeds Available Time";

      // Đánh giá tổng thể
      let overallPerformance;
      if (performance === "Good Performance" && consistency === "Consistent") {
        overallPerformance =
          timeEvaluation === "Exceeds Available Time"
            ? "Good Performance (Consider Adjusting Time)"
            : "Good Performance";
      } else if (
        performance === "Needs Improvement" ||
        consistency === "Inconsistent"
      ) {
        overallPerformance = "Needs Improvement";
      } else {
        overallPerformance = "Moderate Performance";
      }

      return {
        performance: overallPerformance,
        consistency,
        intensity,
        timeTrend,
        timeEvaluation,
      };
    };

    const performanceEvaluation = evaluatePerformance(dailyStats, healthStatus);
    // Lấy bài tập gợi ý dựa trên đánh giá hàng tuần
    const recommendedExercises = await getRecommendedExercises(
      healthStatus,
      performanceEvaluation.weekly
    );
    const feedbackReport = generatePersonalizedFeedback(
      performanceEvaluation,
      healthStatus.fitnessGoals
    );

    return json({
      user,
      dailyStats,
      performanceEvaluation,
      recommendedExercises,
      feedbackReport,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return json({ error: "Error fetching stats" }, { status: 500 });
  }
};

export default function Stats() {
  const {
    user,
    dailyStats,
    performanceEvaluation,
    recommendedExercises,
    feedbackReport,
  } = useLoaderData();
  const fetcher = useFetcher();
  const logout = () => {
    fetcher.submit(null, { method: "post", action: "/auth/logout" });
  };
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]; // Màu sắc biểu đồ
  // Tính toán ngày hiện tại và ngày tạo lâu nhất
  const oldestRecordDate = useMemo(() => {
    if (dailyStats.length === 0) return null;
    return new Date(
      Math.min(...dailyStats.map((stat) => new Date(stat.date).getTime()))
    );
  }, [dailyStats]);

  const currentDate = new Date();
  const daysSinceOldestRecord = oldestRecordDate
    ? Math.floor((currentDate - oldestRecordDate) / (1000 * 60 * 60 * 24))
    : null;
  console.log("Days since oldest record:", daysSinceOldestRecord);
  console.log("Performance Evaluation (Weekly):", performanceEvaluation.weekly);
  console.log(
    "Performance Evaluation (Monthly):",
    performanceEvaluation.monthly
  );
  console.log("Daily Stats:", dailyStats);
  console.log("feedbackReport:", feedbackReport);
  const navigate = useNavigate();
  const handleNavigateToDetail = (workoutId) => {
    console.log("Navigating to workout ID:", workoutId);
    navigate(`/ExerciseDetail/?pI=${workoutId}`);
  };
  return (
    <>
      <Navbar className="custom-navbar2">
        <div className="navbar-left">
          {/* Logo ở bên trái */}
          <NavbarBrand>
            <img className="logo_icon" src="./logo.png" alt="logo" />
          </NavbarBrand>
        </div>

        {/* Nội dung trung tâm */}
        <NavbarContent className="navbar-center hidden sm:flex gap-4">
          <NavbarItem>
            <Link color="foreground" href="#">
              {/* Features */}
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link color="foreground" href="#" aria-current="page">
              {/* Customers */}
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link color="foreground" href="#">
              {/* Integrations */}
            </Link>
          </NavbarItem>
        </NavbarContent>

        <div className="navbar-right">
          {/* Avatar ở bên phải */}
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                isBordered
                as="button"
                className="transition-transform"
                color="success"
                name={user._json.name}
                size="sm"
                src={user._json.picture}
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile Actions" variant="flat">
              <DropdownItem key="profile" className="h-14 gap-2">
                <p className="font-semibold">{user._json.name}</p>
                <p className="font-semibold">{user._json.email}</p>
              </DropdownItem>
              <DropdownItem className="item" key="help_and_feedback">
                <a href="/HealthStatus">HealthStatus</a>
              </DropdownItem>
              <DropdownItem className="item" key="help_and_feedback">
                <a href="/Workout">Workout</a>
              </DropdownItem>
              <DropdownItem className="item" key="help_and_feedback">
                <a href="/Recommended/workout">Recommended workout</a>
              </DropdownItem>
              <DropdownItem className="item" key="help_and_feedback">
                <a href="/WorkoutPlan">WorkoutPlan</a>
              </DropdownItem>
              <DropdownItem className="item" key="logout" color="danger">
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <Button onClick={logout}> Sign Out </Button>
                </div>
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </Navbar>
      <div className="stats-container">
        <div className="header">
          <TooltipNextui key="top-start" placement="top-start" content="Back">
            <Link to="/home">
              {/* <img onClick={handleClick} src="/back.svg" alt="back icon" /> */}
              <img className="icon-back" src="/back.svg" alt="back icon" />
            </Link>
          </TooltipNextui>
          <h1 className="page-title">Workout Statistics</h1>
        </div>
        {dailyStats.length === 0 ? (
          <p>No data available for your workouts.</p>
        ) : (
          <div>
            {/* Biểu đồ thanh */}
            <div className="chart-section">
              <h2>Daily Workout Summary</h2>
              <ResponsiveContainer width="80%" height={400}>
                <BarChart data={dailyStats} barCategoryGap="15%">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="totalTimeSpent" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Chi tiết bài tập */}
            <div className="details-section">
              <h2>Detailed Statistics</h2>
              <Accordion variant="splitted" className="workout-plan-accordion">
                <AccordionItem title="Total Time Spent">
                  {dailyStats.map((stat) => (
                    <div key={stat.date} className="daily-stats">
                      <h3>{stat.date}</h3>
                      <p className="total-time-container">
                        <span className="icon-time">
                          <i className="fas fa-clock"></i> {/* Icon đồng hồ */}
                        </span>
                        <strong>Total Time Spent:</strong> {stat.totalTimeSpent}{" "}
                        hours
                      </p>

                      <table>
                        <thead>
                          <tr>
                            <th>Exercise Name</th>

                            <th>Time Spent (Minutes)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stat.exercises.map((exercise) => (
                            <tr key={exercise.id}>
                              <td>{exercise.exercise?.name || "Unknown"}</td>
                              <td>
                                {exercise.timeSpent
                                  ? Math.round(exercise.timeSpent / 60)
                                  : "N/A"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </AccordionItem>
              </Accordion>
            </div>
            {/* Tổng quan bài tập */}
            <div className="summary-section">
              <h2>Weekly Overview</h2>
              <div className="summary-group">
                <ResponsiveContainer width="50%" height={300}>
                  <PieChart>
                    <Pie
                      dataKey="totalTimeSpent"
                      data={dailyStats}
                      outerRadius={80}
                      fill="#8884d8"
                      label={({ date }) => date}
                    >
                      {dailyStats.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <p className="total-time-container">
                  <span className="icon-time">
                    <i className="fas fa-clock"></i> {/* Icon đồng hồ */}
                  </span>
                  <strong>Total Time Spent This Week:</strong>{" "}
                  {dailyStats
                    .reduce((total, stat) => total + stat.totalTimeSpent, 0)
                    .toFixed(2)}{" "}
                  hours
                </p>
              </div>
              <h2>Fitness Performance Overview</h2>
              <Accordion variant="splitted" className="workout-plan-accordion">
                <AccordionItem title="Last 7 Days Evaluation">
                  <h2>Last 7 Days Evaluation</h2>
                  {daysSinceOldestRecord >= 7 ? (
                    <div>
                      {typeof performanceEvaluation.weekly === "string" ? (
                        <p>{performanceEvaluation.weekly}</p>
                      ) : performanceEvaluation.weekly ? (
                        <>
                          <h3>
                            Performance:{" "}
                            {performanceEvaluation.weekly.performance}
                          </h3>
                          <h3>
                            Intensity: {performanceEvaluation.weekly.intensity}
                          </h3>
                          <h3>
                            Frequency: {performanceEvaluation.weekly.frequency}
                          </h3>
                          <h3>
                            Time Evaluation:
                            {performanceEvaluation.weekly.timeEvaluation}
                          </h3>
                          <h3>
                            Weekly Feedback: {feedbackReport.weeklyFeedback}
                          </h3>
                          <h3>
                            Weekly Recommendations{" "}
                            {feedbackReport.weeklyRecommendations.map(
                              (recommendation, index) => (
                                <li key={index}>{recommendation}</li>
                              )
                            )}
                          </h3>
                          <ul></ul>
                        </>
                      ) : (
                        <p>Not enough data for evaluation</p>
                      )}
                    </div>
                  ) : (
                    <p>Not enough data for evaluation</p>
                  )}
                </AccordionItem>
                <AccordionItem title="Last 30 Days Evaluation">
                  <h2>Last 30 Days Evaluation</h2>
                  {daysSinceOldestRecord >= 30 ? (
                    <div>
                      {typeof performanceEvaluation.monthly === "string" ? (
                        <p>{performanceEvaluation.monthly}</p>
                      ) : performanceEvaluation.monthly ? (
                        <>
                          <h3>
                            Performance:{" "}
                            {performanceEvaluation.monthly.performance}
                          </h3>
                          <h3>
                            Consistency:{" "}
                            {performanceEvaluation.monthly.consistency}
                          </h3>
                          <h3>
                            Intensity: {performanceEvaluation.monthly.intensity}
                          </h3>
                          <h3>
                            Time Evaluation:{" "}
                            {performanceEvaluation.monthly.timeEvaluation}
                          </h3>
                          <h3>
                            Monthly Feedback : {feedbackReport.monthlyFeedback}
                          </h3>

                          <h3>
                            Monthly Recommendations{" "}
                            {feedbackReport.monthlyRecommendations.map(
                              (recommendation, index) => (
                                <li key={index}>{recommendation}</li>
                              )
                            )}
                          </h3>
                          <ul></ul>
                        </>
                      ) : (
                        <p>Not enough data for evaluation</p>
                      )}
                    </div>
                  ) : (
                    <p>Not enough data for evaluation</p>
                  )}
                </AccordionItem>
                <AccordionItem title="Goal-Specific Recommendations">
                  {feedbackReport.goalRecommendations.length > 0 && (
                    <div>
                      <h2>Goal-Specific Recommendations</h2>
                      <h3>
                        {feedbackReport.goalRecommendations.map(
                          (recommendation, index) => (
                            <li key={index}>{recommendation}</li>
                          )
                        )}
                      </h3>
                    </div>
                  )}
                </AccordionItem>
                <AccordionItem title="Recommended Exercises">
                  <div className="recommended-exercises">
                    <h2>Recommended Exercises</h2>
                    {recommendedExercises.length === 0 ? (
                      <p>No exercises found for your preferences.</p>
                    ) : (
                      <ul>
                        {recommendedExercises.map((exercise) => (
                          <li
                            key={exercise.id}
                            className="exercise-item"
                            onClick={() => handleNavigateToDetail(exercise.id)} // Thêm sự kiện onClick
                            style={{ cursor: "pointer" }} // Thêm con trỏ chuột để hiển thị có thể click
                          >
                            <h3>{exercise.name}</h3>
                            <p>Target: {exercise.target}</p>
                            <p>Body Part: {exercise.bodyPart}</p>
                            <p>Equipment: {exercise.equipment}</p>
                            <p>Intensity: {exercise.intensity}</p>
                            <p>Time: {exercise.time} minutes</p>
                            <img
                              src={exercise.gifUrl}
                              alt={`${exercise.name} demo`}
                              className="exercise-gif"
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        )}
      </div>
      <footer>
        <section className="bg-white">
          <div className="max-w-screen-xl px-4 py-12 mx-auto space-y-8 overflow-hidden sm:px-6 lg:px-8">
            <nav className="flex flex-wrap justify-center -mx-5 -my-2">
              <div className="px-5 py-2">
                <a
                  href="#"
                  className="text-base leading-6 text-gray-500 hover:text-gray-900"
                >
                  About
                </a>
              </div>
              <div className="px-5 py-2">
                <a
                  href="#"
                  className="text-base leading-6 text-gray-500 hover:text-gray-900"
                >
                  Blog
                </a>
              </div>
              <div className="px-5 py-2">
                <a
                  href="#"
                  className="text-base leading-6 text-gray-500 hover:text-gray-900"
                >
                  Team
                </a>
              </div>
              <div className="px-5 py-2">
                <a
                  href="#"
                  className="text-base leading-6 text-gray-500 hover:text-gray-900"
                >
                  Pricing
                </a>
              </div>
              <div className="px-5 py-2">
                <a
                  href="#"
                  className="text-base leading-6 text-gray-500 hover:text-gray-900"
                >
                  Contact
                </a>
              </div>
              <div className="px-5 py-2">
                <a
                  href="#"
                  className="text-base leading-6 text-gray-500 hover:text-gray-900"
                >
                  Terms
                </a>
              </div>
            </nav>
            <div className="flex justify-center mt-8 space-x-6">
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Facebook</span>
                <svg
                  className="w-6 h-6"
                  aria-hidden="true"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Instagram</span>
                <svg
                  className="w-6 h-6"
                  aria-hidden="true"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Twitter</span>
                <svg
                  className="w-6 h-6"
                  aria-hidden="true"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">GitHub</span>
                <svg
                  className="w-6 h-6"
                  aria-hidden="true"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Dribbble</span>
                <svg
                  className="w-6 h-6"
                  aria-hidden="true"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm6.605 4.61a8.502 8.502 0 011.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.416 25.416 0 00-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0112 3.475zm-3.633.803a53.896 53.896 0 013.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 014.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.25.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 01-2.19-5.705zM12 20.547a8.482 8.482 0 01-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.318 35.318 0 011.823 6.475 8.4 8.4 0 01-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 01-3.655 5.715z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </a>
            </div>
            <p className="mt-8 text-base leading-6 text-center text-gray-400">
              © 2024 Tisi Exercise.
            </p>
          </div>
        </section>
      </footer>
    </>
  );
}
