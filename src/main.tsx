import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { EmbedRoute } from "./EmbedRoute";
import "./styles/main.scss";

const routePath = window.location.pathname.replace(/\/$/, "");
const route = routePath === "/embed" ? <EmbedRoute /> : <App />;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {route}
  </StrictMode>,
);
