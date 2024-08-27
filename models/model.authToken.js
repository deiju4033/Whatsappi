import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const AuthToken = sequelize.define("AuthToken", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

export default AuthToken;
