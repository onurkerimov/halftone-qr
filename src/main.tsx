import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { EmbedRoute } from "./EmbedRoute";
import "./styles/main.scss";

const route = window.location.pathname === "/embed" ? <EmbedRoute /> : <App />;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {route}
  </StrictMode>,
);
