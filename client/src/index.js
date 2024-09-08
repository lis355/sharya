import axios from "axios";
import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import "normalize.css";
import "./index.css";

const requestProvider = axios.create({
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
	<React.StrictMode>
		<App requestProvider={requestProvider} />
	</React.StrictMode>
);
