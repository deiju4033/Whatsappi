import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./model.user.js";

const Contact = sequelize.define("Contact", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  contactUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  nickname: {
    type: DataTypes.STRING,
  },
  blocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

Contact.belongsTo(User, { foreignKey: 'contactUserId', as: 'contactUser' });
User.hasMany(Contact, { foreignKey: 'contactUserId', as: 'contacts' });

export default Contact;