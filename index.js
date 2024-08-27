import express from "express";
import cors from "cors";
import sequelize from "./config/db.js";
import userRoutes from "./routes/user.routes.js";
import companyRoutes from "./routes/company.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import messageRoutes from "./routes/message.routes.js";
import whatsappRoutes from "./routes/whatsapp.routes.js";
import companyUserRoutes from "./routes/companyUser.routes.js";


const app = express();

// CORS configuration
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "X-Username", "X-Password", "X-Token"],
  })
);

// Middleware
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("Hello World");
});

app.use("/api/users", userRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/company-users", companyUserRoutes);




// Server setup
const PORT = process.env.PORT || 8003;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection to the database has been established successfully.");
    return sequelize.sync({ force: false });
  })
  .then(() => {
    console.log("Database synchronized successfully.");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });