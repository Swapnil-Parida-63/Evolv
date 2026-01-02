import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import aiRoutes from "./routes/aiRoutes.js";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";




dotenv.config();
connectDB();
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => res.send("AI Talent Nexus Backend Running"));
app.use("/api/ai", aiRoutes);
console.log("server is running on port", process.env.PORT);

app.listen(process.env.PORT, () => console.log(`Server running on http://localhost:${process.env.PORT}`));
