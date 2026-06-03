import { json, redirect } from "@remix-run/node";
import { authenticator } from "../server/auth.server";
import { prisma } from "../server/db.server";
import { getSession, commitSession } from "../server/auth.server";
import { useLoaderData, Form } from "@remix-run/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Button,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  Avatar,
} from "@nextui-org/react";
import { useState } from "react";
import { Link } from "@remix-run/react";
import "../styles/admin.css";
// import "../styles/home.css";
import { useFetcher } from "@remix-run/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/react";
import { Toaster, toast } from "sonner";
import { useEffect } from "react";
// Fetch dữ liệu từ database cho thống kê
const fetchUserStats = async () => {
  const totalUsers = await prisma.user.count();

  // Lấy tất cả ngày tạo tài khoản
  const userStats = await prisma.user.findMany({
    select: {
      createdAt: true,
    },
  });

  // Gộp dữ liệu theo ngày
  const statsMap = userStats.reduce((acc, user) => {
    const date = new Date(user.createdAt).toLocaleDateString(); // Chuyển ngày về dạng chuỗi
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date]++;
    return acc;
  }, {});

  // Chuyển map thành mảng
  const dailyStats = Object.entries(statsMap).map(([date, totalUsers]) => ({
    date,
    totalUsers,
  }));

  return {
    totalUsers,
    dailyStats,
  };
};

const fetchExerciseStats = async () => {
  const totalExercises = await prisma.exercise.count();
  const exercises = await prisma.exercise.findMany();

  return {
    totalExercises,
    exercises,
  };
};

export const loader = async ({ request }) => {
  const user = await authenticator.isAuthenticated(request);
  if (!user) {
    return json({ error: "User not authenticated" }, { status: 401 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: user._json.email },
  });

  if (!existingUser) {
    return redirect("/404");
  }

  if (!existingUser.isAdmin) {
    return redirect("/404");
  }

  const session = await getSession(request.headers.get("Cookie"));
  if (!session.get("userId")) {
    session.set("userId", existingUser.id);
  }
  const cookieHeader = await commitSession(session);

  const userData = await fetchUserStats();
  const dataUser = await prisma.user.findMany();
  const dataExercise = await prisma.Exercise.findMany();
  const exerciseData = await fetchExerciseStats();
  // Lấy dữ liệu số lượng user theo ngày
  const userStats = await prisma.user.groupBy({
    by: ["createdAt"],
    _count: { id: true },
    orderBy: { createdAt: "asc" },
  });

  // Định dạng dữ liệu để dễ sử dụng trong biểu đồ
  const formattedStats = userStats.map((stat) => ({
    date: stat.createdAt.toISOString().split("T")[0], // Chỉ lấy ngày (YYYY-MM-DD)
    count: stat._count.id,
  }));
  const allReviews = getAllReviews(dataExercise);
  return json(
    {
      user: existingUser,
      message: "Admin user data fetched successfully!",
      userData,
      exerciseData,
      userStats: formattedStats,
      dataUser,
      dataExercise: allReviews,
    },
    {
      headers: {
        "Set-Cookie": cookieHeader,
      },
    }
  );
};
const getAllReviews = (reviews) => {
  // Kiểm tra xem reviews có dữ liệu không
  if (!reviews || reviews.length === 0) {
    return []; // Trả về mảng rỗng nếu không có đánh giá
  }

  return reviews.map((review) => ({
    ...review,
    // Nếu bạn có thêm thông tin sản phẩm khác cần thiết, hãy thêm vào đây
  }));
};
export default function AdminPage() {
  const { user, message, userData, exerciseData, dataUser, dataExercise } =
    useLoaderData();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedExercise, setSelectedexercise] = useState(null);

  const fetcher = useFetcher();
  const logout = () => {
    fetcher.submit(null, { method: "post", action: "/auth/logout" });
  };
  const {
    isOpen: isOpenuser,
    onOpen: onOpenuser,
    onOpenChange: onOpenChangeuser,
  } = useDisclosure();
  const {
    isOpen: isOpenuser2,
    onOpen: onOpenuser2,
    onOpenChange: onOpenChangeuser2,
  } = useDisclosure();
  const {
    isOpen: isOpenuser3,
    onOpen: onOpenuser3,
    onOpenChange: onOpenChangeuser3,
  } = useDisclosure();
  const {
    isOpen: isOpenuser4,
    onOpen: onOpenuser4,
    onOpenChange: onOpenChangeuser4,
  } = useDisclosure();
  const {
    isOpen: isOpenuser5,
    onOpen: onOpenuser5,
    onOpenChange: onOpenChangeuser5,
  } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);
  const handleDeleteuser = async (e) => {
    e.preventDefault(); // Ngăn chặn reload trang
    setIsLoading(true); // Bắt đầu trạng thái loading

    const formData = new FormData(e.target); // Lấy dữ liệu từ form

    try {
      const response = await fetch("/delete_user", {
        method: "POST",
        body: formData,
      });

      console.log(response.status); // Log status code

      if (response.ok) {
        toast.success("Deleted successful.");
      } else {
        toast.error(`Failed to delete. Status code: ${response.status}`);
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("An error occurred while deleting the review.");
    } finally {
      setIsLoading(false); // Kết thúc trạng thái loading
      setTimeout(() => {
        window.location.reload();
      }, 500);
      onClose();
    }
  };

  const handleDeleteExercise = async (e) => {
    e.preventDefault(); // Ngăn chặn reload trang
    setIsLoading(true); // Bắt đầu trạng thái loading

    const formData = new FormData(e.target); // Lấy dữ liệu từ form

    try {
      const response = await fetch("/delete_exercise", {
        method: "POST",
        body: formData,
      });

      console.log(response.status); // Log status code

      if (response.ok) {
        toast.success("Deleted successful.");
      } else {
        toast.error(`Failed to delete. Status code: ${response.status}`);
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("An error occurred while deleting the review.");
    } finally {
      setIsLoading(false); // Kết thúc trạng thái loading
      setTimeout(() => {
        window.location.reload();
      }, 500);
      onClose();
    }
  };
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.target);

      const response = await fetch("/update_user", {
        method: "POST",
        body: formData, // Gửi form data thay vì JSON
      });

      if (response.ok) {
        toast.success("User updated successfully", {
          autoClose: 5000, // Hiển thị trong 5 giây
        });
        setIsOpenEdit(false);
      } else {
        const result = await response.json();
        toast.error(`Error: ${result.error}`);
      }
    } catch (error) {
      // toast.error(`An unexpected error occurred: ${error.message}`);
    } finally {
      setTimeout(() => {
        window.location.reload();
      }, 500);
      setIsLoading(false);
    }
  };

  const handleAddExercise = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.target);

      const response = await fetch("/create_exercise", {
        method: "POST",
        body: formData, // Gửi form data thay vì JSON
      });

      if (response.ok) {
        toast.success("Exercise created successfully", {
          autoClose: 5000, // Hiển thị trong 5 giây
        });
        setIsOpenEdit(false);
      } else {
        const result = await response.json();
        toast.error(`Error: ${result.error}`);
      }
    } catch (error) {
      // toast.error(`An unexpected error occurred: ${error.message}`);
    } finally {
      setTimeout(() => {
        window.location.reload();
      }, 500);
      setIsLoading(false);
    }
  };
  const handleUpdateExercise = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.target);

      const response = await fetch("/update_exercise", {
        method: "POST",
        body: formData, // Gửi form data thay vì JSON
      });

      if (response.ok) {
        toast.success("Exercise updated successfully", {
          autoClose: 5000, // Hiển thị trong 5 giây
        });
        setIsOpenEdit(false);
      } else {
        const result = await response.json();
        toast.error(`Error: ${result.error}`);
      }
    } catch (error) {
      // toast.error(`An unexpected error occurred: ${error.message}`);
    } finally {
      setTimeout(() => {
        window.location.reload();
      }, 500);
      setIsLoading(false);
    }
  };
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const page = parseInt(params.get("currentPage"), 10);
      return page && !isNaN(page) ? page : 1;
    }
    return 1;
  });

  const reviewsPerPage = 9;

  // Cập nhật URL khi currentPage thay đổi, đảm bảo code chỉ chạy client-side
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("currentPage", currentPage);
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?${params}`
      );
    }
  }, [currentPage]);

  // Gộp tất cả review từ các sản phẩm
  const allReviews = getAllReviews(dataExercise);

  // Tính tổng số trang
  const totalReviews = allReviews.length;
  const totalPages = Math.ceil(totalReviews / reviewsPerPage);

  // Tính toán startIndex và endIndex dựa trên trang hiện tại
  const startIndex = (currentPage - 1) * reviewsPerPage;
  const endIndex = startIndex + reviewsPerPage;
  const currentReviews = allReviews.slice(startIndex, endIndex);

  const handleNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  const handlePreviousPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const generatePaginationItems = () => {
    const items = [];
    items.push(1);

    if (totalPages > 5) {
      if (currentPage <= 4) {
        for (let i = 2; i <= 5; i++) {
          items.push(i);
        }
        items.push("forward");
        items.push(totalPages);
      } else if (currentPage >= 5 && currentPage <= totalPages - 4) {
        items.push("backward");
        items.push(currentPage - 1);
        items.push(currentPage);
        items.push(currentPage + 1);
        items.push("forward");
        items.push(totalPages);
      } else {
        items.push("backward");
        for (let i = totalPages - 4; i <= totalPages; i++) {
          items.push(i);
        }
      }
    } else {
      for (let i = 2; i <= totalPages; i++) {
        items.push(i);
      }
    }

    return items;
  };
  console.log(getAllReviews.length);
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 3;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);

    return () => clearInterval(interval);
  }, [totalSlides]);
  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="app-container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Dashboard
          </button>
          <button
            className={`tab ${activeTab === "userManagement" ? "active" : ""}`}
            onClick={() => setActiveTab("userManagement")}
          >
            User Management
          </button>
          <button
            className={`tab ${
              activeTab === "exerciseManagement" ? "active" : ""
            }`}
            onClick={() => setActiveTab("exerciseManagement")}
          >
            Exercise Management
          </button>
        </div>
        <div className="tab-content">
          {activeTab === "overview" && (
            <div>
              <div className="main-content">
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
                          name={user.name}
                          size="sm"
                          src={user.picture}
                        />
                      </DropdownTrigger>
                      <DropdownMenu aria-label="Profile Actions" variant="flat">
                        <DropdownItem key="profile" className="h-14 gap-2">
                          <p className="font-semibold">{user.name}</p>
                          <p className="font-semibold">{user.email}</p>
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
                        <DropdownItem className="item" key="help_and_feedback">
                          <a href="/Stats">Stats</a>
                        </DropdownItem>

                        <DropdownItem key="logout" color="danger">
                          <Button onClick={logout}> Sign Out </Button>
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </Navbar>
                <div>
                  <div>
                    <div className="stats-grid">
                      <div className="stats-card">
                        <h3>Toatal User</h3>
                        <p>{userData.totalUsers}</p>
                      </div>
                      <div className="stats-card">
                        <h3>Total Exercise</h3>
                        <p>{exerciseData.totalExercises}</p>
                      </div>
                    </div>

                    <div>
                      <div className="chart-section">
                        <ResponsiveContainer width="80%" height={400}>
                          <BarChart
                            data={userData.dailyStats}
                            barCategoryGap="15%"
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="totalUsers" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === "userManagement" && (
            <>
              <div>
                <div className="user-management">
                  {/* <div className="user-actions">
                    <Button
                      onPress={() => {
                        onOpenuser3();
                      }}
                    >
                      Add user  
                    </Button>
                  </div> */}

                  <table className="user-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataUser.map((user) => (
                        <tr key={user.id}>
                          <td>{user.userName}</td>
                          <td>{user.email}</td>
                          <td>
                            <Button
                              onPress={() => {
                                setSelectedUser(user);
                                onOpenuser2();
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              onPress={() => {
                                setSelectedUser(user);
                                onOpenuser();
                              }}
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <Modal isOpen={isOpenuser} onOpenChange={onOpenChangeuser}>
                <ModalContent>
                  {(onClose) => (
                    <>
                      <ModalHeader className="flex flex-col gap-1">
                        Delete
                      </ModalHeader>
                      <ModalBody>
                        <p>
                          Are you sure you want to delete this user? This action
                          cannot be undone.
                        </p>
                      </ModalBody>
                      <ModalFooter>
                        <Button
                          color="danger"
                          variant="light"
                          onPress={onClose}
                        >
                          Close
                        </Button>
                        <Form
                          method="post"
                          action="/delete_user"
                          onSubmit={handleDeleteuser}
                        >
                          <input
                            type="hidden"
                            name="userId"
                            value={selectedUser.id}
                          />
                          <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Deleting..." : "Delete"}
                          </Button>
                        </Form>
                      </ModalFooter>
                    </>
                  )}
                </ModalContent>
              </Modal>
              <Modal isOpen={isOpenuser2} onOpenChange={onOpenChangeuser2}>
                <ModalContent>
                  {(onClose) => (
                    <>
                      <ModalHeader className="flex flex-col gap-1">
                        Edit
                      </ModalHeader>
                      <ModalBody>
                        <p>
                          Are you sure you want to edit this user? This action
                          cannot be undone.
                        </p>
                        <Form
                          method="post"
                          action="/update_user"
                          onSubmit={handleUpdateUser}
                          className="edit_from"
                        >
                          <input
                            type="hidden"
                            name="userId"
                            value={selectedUser.id}
                          />
                          <label>
                            Email:
                            <input
                              type="text"
                              name="email"
                              defaultValue={selectedUser.email}
                              required
                            />
                          </label>
                          <label>
                            User Name:
                            <input
                              type="text"
                              name="userName"
                              defaultValue={selectedUser.userName}
                              required
                            />
                          </label>
                          <label>
                            Admin:
                            <input
                              type="checkbox"
                              name="isAdmin"
                              id="isAdmin"
                              checked={selectedUser.isAdmin} // Hiển thị trạng thái checkbox (checked hoặc unchecked)
                              onChange={(e) =>
                                setSelectedUser({
                                  ...selectedUser,
                                  isAdmin: e.target.checked,
                                })
                              } // Lưu giá trị checked (true hoặc false) vào state
                            />
                          </label>

                          <ModalFooter>
                            <Button
                              color="danger"
                              variant="light"
                              onPress={onClose}
                            >
                              Close
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                              {isLoading ? "Updating..." : "Update"}
                            </Button>
                          </ModalFooter>
                        </Form>
                        <ModalFooter></ModalFooter>
                      </ModalBody>
                    </>
                  )}
                </ModalContent>
              </Modal>
            </>
          )}
          {activeTab === "exerciseManagement" && (
            <>
              <div>
                <div className="user-management">
                  <div className="user-actions">
                    <Button
                      color="primary"
                      onPress={() => {
                        onOpenuser5();
                      }}
                    >
                      Add Exercise
                    </Button>
                  </div>

                  <table className="user-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Intensity</th>
                        <th>Instructions</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allReviews
                        .slice(startIndex, endIndex)
                        .map((exercise) => (
                          <tr key={exercise.id}>
                            <td>{exercise.name}</td>
                            <td>{exercise.intensity}</td>
                            <td>{exercise.instructions}</td>
                            <td>
                              <Button
                                onPress={() => {
                                  setSelectedexercise(exercise);
                                  onOpenuser3();
                                }}
                              >
                                Edit
                              </Button>

                              <Button
                                onPress={() => {
                                  setSelectedexercise(exercise);
                                  onOpenuser4();
                                }}
                              >
                                Delete
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  <div className="pagination">
                    <Button
                      size="sm"
                      variant="bordered"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>

                    {generatePaginationItems().map((item, index) => (
                      <span key={index}>
                        {item === "backward" ? (
                          <Button
                            size="sm"
                            variant="bordered"
                            onClick={() => setCurrentPage(currentPage - 3)}
                            className="ellipsis-button ellipsis-backward"
                          >
                            {"..."}
                          </Button>
                        ) : item === "forward" ? (
                          <Button
                            size="sm"
                            variant="bordered"
                            onClick={() => setCurrentPage(currentPage + 3)}
                            className="ellipsis-button ellipsis-forward"
                          >
                            {"..."}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant={
                              currentPage === item ? "solid" : "bordered"
                            }
                            onClick={() => setCurrentPage(item)}
                          >
                            {item}
                          </Button>
                        )}
                      </span>
                    ))}

                    <Button
                      size="sm"
                      variant="bordered"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
              <Modal isOpen={isOpenuser3} onOpenChange={onOpenChangeuser3}>
                <ModalContent>
                  {(onClose) => (
                    <>
                      <ModalHeader className="flex flex-col gap-1">
                        Edit
                      </ModalHeader>
                      <ModalBody>
                        <Form
                          method="post"
                          action="/update_exercise"
                          onSubmit={handleUpdateExercise}
                          className="edit_from"
                        >
                          <input
                            type="hidden"
                            name="exerciseId"
                            value={selectedExercise.id}
                          />
                          <label>
                            Name:
                            <input
                              type="text"
                              name="name"
                              defaultValue={selectedExercise.name}
                              required
                            />
                          </label>
                          <label>
                            Target:
                            <input
                              type="text"
                              name="target"
                              defaultValue={selectedExercise.target}
                              required
                            />
                          </label>
                          <label>
                            Secondary Muscles:
                            <input
                              type="text"
                              name="secondaryMuscles"
                              defaultValue={selectedExercise.secondaryMuscles}
                              required
                            />
                          </label>
                          <label>
                            Body Part:
                            <input
                              type="text"
                              name="bodyPart"
                              defaultValue={selectedExercise.bodyPart}
                              required
                            />
                          </label>
                          <label>
                            Equipment:
                            <input
                              type="text"
                              name="equipment"
                              defaultValue={selectedExercise.equipment}
                              required
                            />
                          </label>
                          <label>
                            Difficulty:
                            <input
                              type="text"
                              name="difficulty"
                              defaultValue={selectedExercise.difficulty}
                              required
                            />
                          </label>
                          <label>
                            Time:
                            <input
                              type="text"
                              name="time"
                              defaultValue={selectedExercise.time}
                              required
                            />
                          </label>
                          <label>
                            Intensity:
                            <input
                              type="text"
                              name="intensity"
                              defaultValue={selectedExercise.intensity}
                              required
                            />
                          </label>
                          <label>
                            Health Conditions:
                            <input
                              type="text"
                              name="healthConditions"
                              defaultValue={selectedExercise.healthConditions}
                              required
                            />
                          </label>
                          <label>
                            Instructions:
                            <input
                              type="text"
                              name="instructions"
                              defaultValue={selectedExercise.instructions}
                              required
                            />
                          </label>
                          <ModalFooter>
                            <Button
                              color="danger"
                              variant="light"
                              onPress={onClose}
                            >
                              Close
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                              {isLoading ? "Updating..." : "Update"}
                            </Button>
                          </ModalFooter>
                        </Form>
                        <ModalFooter></ModalFooter>
                      </ModalBody>
                    </>
                  )}
                </ModalContent>
              </Modal>
              <Modal isOpen={isOpenuser4} onOpenChange={onOpenChangeuser4}>
                <ModalContent>
                  {(onClose) => (
                    <>
                      <ModalHeader className="flex flex-col gap-1">
                        Delete
                      </ModalHeader>
                      <ModalBody>
                        <p>
                          Are you sure you want to delete this exercise? This
                          action cannot be undone.
                        </p>
                      </ModalBody>
                      <ModalFooter>
                        <Button
                          color="danger"
                          variant="light"
                          onPress={onClose}
                        >
                          Close
                        </Button>
                        <Form
                          method="post"
                          action="/delete_exercise"
                          onSubmit={handleDeleteExercise}
                        >
                          <input
                            type="hidden"
                            name="exerciseId"
                            value={selectedExercise.id}
                          />
                          <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Deleting..." : "Delete"}
                          </Button>
                        </Form>
                      </ModalFooter>
                    </>
                  )}
                </ModalContent>
              </Modal>

              <Modal isOpen={isOpenuser5} onOpenChange={onOpenChangeuser5}>
                <ModalContent>
                  {(onClose) => (
                    <>
                      <ModalHeader className="flex flex-col gap-1">
                        Add Exercise
                      </ModalHeader>
                      <ModalBody>
                        <p>
                          Are you sure you want to add this exercise? This
                          action
                        </p>
                        <Form
                          method="post"
                          action="/create_exercise"
                          onSubmit={handleAddExercise}
                          className="edit_from"
                        >
                          <label>
                            Name:
                            <input
                              type="text"
                              name="name"
                              placeholder="Enter your name..."
                              required
                            />
                          </label>
                          <label>
                            Target:
                            <input
                              type="text"
                              name="target"
                              placeholder="Enter target..."
                              required
                            />
                          </label>
                          <label>
                            Secondary Muscles:
                            <input
                              type="text"
                              name="secondaryMuscles"
                              placeholder="Enter secondary muscles..."
                              required
                            />
                          </label>
                          <label>
                            Body Part:
                            <input
                              type="text"
                              name="bodyPart"
                              placeholder="Enter body part..."
                              required
                            />
                          </label>
                          <label>
                            Equipment:
                            <input
                              type="text"
                              name="equipment"
                              placeholder="Enter equipment..."
                              required
                            />
                          </label>
                          <label>
                            Difficulty:
                            <input
                              type="text"
                              name="difficulty"
                              placeholder="Enter difficulty..."
                              required
                            />
                          </label>
                          <label>
                            Time:
                            <input
                              type="number"
                              name="time"
                              placeholder="Enter time in minutes..."
                            />
                          </label>
                          <label>
                            Intensity:
                            <input
                              type="text"
                              name="intensity"
                              placeholder="Enter intensity..."
                              required
                            />
                          </label>
                          <label>
                            Health Conditions:
                            <input
                              type="text"
                              name="healthConditions"
                              placeholder="Enter health conditions..."
                              required
                            />
                          </label>
                          <label>
                            Instructions:
                            <input
                              type="text"
                              name="instructions"
                              placeholder="Enter instructions..."
                              required
                            />
                          </label>
                          <label>
                            GifUrl:
                            <input
                              type="text"
                              name="gifUrl"
                              placeholder="Enter GifUrl..."
                              required
                            />
                          </label>

                          <ModalFooter>
                            <Button
                              color="danger"
                              variant="light"
                              onPress={onClose}
                            >
                              Close
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                              {isLoading ? "Saving..." : "Save"}
                            </Button>
                          </ModalFooter>
                        </Form>
                        <ModalFooter></ModalFooter>
                      </ModalBody>
                    </>
                  )}
                </ModalContent>
              </Modal>
            </>
          )}
        </div>
      </div>
    </>
  );
}
