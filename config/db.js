import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    port: 4000, // Port configuration
    dialectOptions: {
      ssl: {
        require: true, // This will ensure that SSL is used
        rejectUnauthorized: false 
      },
    },
  }
);

sequelize
  .authenticate()
  .then(() => console.log("Connected to MySQL database via Sequelize"))
  .catch((err) => console.error("Unable to connect to the database:", err));

export default sequelize;
