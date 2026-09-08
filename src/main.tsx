import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "@kern-ux/native/dist/kern.min.css";
import "@kern-ux/native/dist/kern-grid.min.css";
import "@kern-ux/native/dist/fonts/fira-sans.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
