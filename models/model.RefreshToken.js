import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const RefreshToken = sequelize.define("RefreshToken", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
});

export default RefreshToken;
