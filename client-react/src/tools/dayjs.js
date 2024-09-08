import dayjs from "dayjs";
import dayjsDuration from "dayjs/plugin/duration";
import dayjsRelativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(dayjsDuration);
dayjs.extend(dayjsRelativeTime);

export default dayjs;
