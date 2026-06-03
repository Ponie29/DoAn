import { redirect } from "@remix-run/node";
import { authenticator } from "../server/auth.server.js";

// Action đăng xuất và xóa dữ liệu chat
export const action = async ({ request }) => {
  // Đăng xuất người dùng thông qua Auth0
  await authenticator.logout(request, {
    redirectTo: "http://localhost:5173/", // Chuyển hướng đến route để xóa dữ liệu chat
  });

  // Redirect đến Auth0 để thực hiện logout từ Auth0
  // const auth0Domain = "dev-c841kfnfmsjcrhcr.us.auth0.com";
  // const clientId = "UpT0esnQTQjHDg2wBr4MMBQexfZvsFs2";
  // const returnTo = "http://localhost:5173/";

  return redirect(
    `https://${auth0Domain}/v2/logout?client_id=${clientId}&returnTo=${encodeURIComponent(
      returnTo
    )}`
  );
};

// Loader để redirect ngay khi trang được tải
export const loader = async () => {
  return redirect("/");
};
