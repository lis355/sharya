import axios from "axios";
import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import "normalize.css";
import "./index.scss";


const axiosOptions = {};
if (process.env.NODE_ENV === "development") axiosOptions.withCredentials = true;

const requestProvider = axios.create(axiosOptions);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
	<React.StrictMode>
		<App requestProvider={requestProvider} />
	</React.StrictMode>
);
