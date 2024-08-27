// models/model.message.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Message = sequelize.define("Message", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Companies',
      key: 'id',
    },
  },
  companyUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'CompanyUsers',
      key: 'id',
    },
  },
  content: {
    type: DataTypes.TEXT,
  },
  mediaURL: {
    type: DataTypes.STRING,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  status: {
    type: DataTypes.ENUM('sent', 'delivered', 'read'),
    defaultValue: 'sent',
  },
});

export default Message;