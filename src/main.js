import React from "react";
import { createRoot } from "react-dom/client";
import ErrorBoundary from "./ErrorBoundary.js";
import App from "./App.js";
import { el } from "./htm.js";

createRoot(document.getElementById("root")).render(
  el(React.StrictMode, null, el(ErrorBoundary, null, el(App)))
);
