import express, { Express, Request, Response } from "express";
import logger from "morgan";
import swaggerUi from "swagger-ui-express";
import { connect_db } from "./config/db-config";
import { env_conf } from "./config/env-config";
import { specs } from "./config/swagger-config";
const cors = require("cors");
var cookieParser = require("cookie-parser");
const transaction_route = require("./routes/transaction-route");
const app: Express = express();
const port = process.env.PORT;
app.use(express.json());
app.use(
  cors({
    origin: "https://roxiler-frontend-wtc5.vercel.app",
  })
);
app.use(logger("dev"));

app.use(cookieParser());
app.use("/api/v1/transaction", transaction_route);

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, { explorer: true })
);

app.get("/", async (req: Request, res: Response) => {
  res.send("Hello World");
});

const start = (): void => {
  try {
    connect_db();
    app.listen(port, () => {
      console.log(
        `⚡️[server]: Server is running at ${
          env_conf.node_env == "dev" ? `http://localhost:${port}` : port
        } \n📄[docs]: ${
          env_conf.node_env == "dev"
            ? `http://localhost:${port}/api-docs`
            : "https://roxilar-backend.onrender.com/api-docs"
        }`
      );
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
start();
