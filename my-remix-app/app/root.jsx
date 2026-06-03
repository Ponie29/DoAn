import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import "./tailwind.css";
import { NextUIProvider } from "@nextui-org/react";
import Chatbothealthy from "./routes/chatbotapi2.jsx";
export const links = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  {
    rel: "stylesheet",
    href: "https://demos.creative-tim.com/notus-js/assets/styles/tailwind.css",
  },
  {
    rel: "stylesheet",
    href: "https://demos.creative-tim.com/notus-js/assets/vendor/@fortawesome/fontawesome-free/css/all.min.css",
  },
  {
    rel: "stylesheet",
    href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css",
  },
  {
    href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css",
    rel: "stylesheet",
  },
];

export function Layout({ children }) {
  const [showTranslate, setShowTranslate] = useState(false);

  useEffect(() => {
    if (document.getElementById("google_translate_script")) return; // Ngăn chặn load lại nhiều lần

    const addScript = document.createElement("script");
    addScript.src =
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit&hl=en";
    addScript.id = "google_translate_script"; // Thêm ID để tránh thêm lại
    addScript.async = true;
    document.body.appendChild(addScript);

    window.googleTranslateElementInit = () => {
      if (!document.getElementById("google_translate_element").innerHTML) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,vi,fr,zh",
            layout:
              window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          },
          "google_translate_element"
        );
      }
    };
  }, []);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <NextUIProvider>
          {/* Button chọn ngôn ngữ */}
          <div className="fixed top-2 right-4 z-50">
            <button
              onClick={() => setShowTranslate(!showTranslate)}
              className="bg-gray-800 text-white px-4 py-2 rounded-md shadow-md hover:bg-gray-700 transition"
            >
              🌐
            </button>
            <div
              id="google_translate_element"
              className={`absolute right-0 mt-2 bg-white shadow-md rounded-md p-2 w-40 ${
                showTranslate ? "block" : "hidden"
              }`}
            ></div>
          </div>

          {children}
          <ScrollRestoration />
          <Scripts />
        </NextUIProvider>
      </body>
    </html>
  );
}
// {/* <div>
// <Chatbothealthy />
// </div> */}
export default function App() {
  return (
    <>
      <NextUIProvider>
        <Outlet />
        <Chatbothealthy />
      </NextUIProvider>
    </>
  );
}
