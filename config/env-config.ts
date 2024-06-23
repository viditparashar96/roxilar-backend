import dotenv from "dotenv";
dotenv.config();

export const env_conf = {
  port: process.env.PORT || "",
  db_uri: process.env.DB_URI || "",
  node_env: process.env.NODE_ENV || "",

  client_url: process.env.FRONTEND_URL || "",
};
