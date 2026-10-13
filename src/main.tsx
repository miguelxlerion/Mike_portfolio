import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { SiteProvider } from "./store/SiteContext";
import { LangProvider } from "./i18n/LangContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SiteProvider>
      <LangProvider>
        <App />
      </LangProvider>
    </SiteProvider>
  </React.StrictMode>,
);
