import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./app/App";
import { BrowserRouter as Router } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./redux/store";
import "./i18n";
import "./index.css";
import { createBrowserHistory } from "history";
import BootstrapDirectionManager from "./Components/layout/BootstrapDirectionManager";
// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap/dist/css/bootstrap.rtl.min.css';

// import { ToastContainer } from "react-toastify";

export const history = createBrowserHistory(); // to use history outside components

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
console.log('Store:', store); // يجب أن يطبع الكائن وليس null
root.render(
  <React.StrictMode>
    <Router>
      <Provider store={store}>
        <BootstrapDirectionManager />
        <App />
        {/* <ToastContainer /> */}
      </Provider>
    </Router>
  </React.StrictMode>
);
 
