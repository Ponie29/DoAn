import { authenticator } from "../server/auth.server.js";

export const loader = ({ request }) => {
  const url = new URL(request.url);
  const prompt = url.searchParams.get("prompt");
  return authenticator.authenticate("auth0", request, {
    successRedirect: "http://localhost:5173/login",
    failureRedirect: "/",
    authParams: {
      prompt: prompt || "login",
    },
  });
};

export const action = ({ request }) => {
  return authenticator.authenticate("auth0", request, {
    successRedirect: "http://localhost:5173/login",
    failureRedirect: "http://localhost:5173/loi",
  });
};

export default function Auth0Route() {
  return null;
}
