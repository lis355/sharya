import path from "node:path";

import { config as dotenv } from "dotenv-flow";
import fs from "fs-extra";

dotenv();

process.env.CWD = path.resolve(process.cwd());
process.env.DATA = path.join(process.env.CWD, ".data");

fs.ensureDirSync(process.env.DATA);
