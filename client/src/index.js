import axios from "axios";
import dayjs from "dayjs";
import dayjsDuration from "dayjs/plugin/duration";
import dayjsRelativeTime from "dayjs/plugin/relativeTime";
import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import "normalize.css";
import "./index.css";

dayjs.extend(dayjsDuration);
dayjs.extend(dayjsRelativeTime);

const requestProvider = axios.create({
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
	<React.StrictMode>
		<App requestProvider={requestProvider} />
	</React.StrictMode>
);
