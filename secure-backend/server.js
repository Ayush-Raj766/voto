import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./src/db/connectDb.js";
import cors from "cors";

dotenv.config({
  path: "./.env",
});

const app = express();

// ✅ Allowed origins
const allowedOrigins = [
  "http://localhost:8080",
  "http://localhost:5173",
  "https://voto-livid.vercel.app",
];

// ✅ CORS setup (ONLY ONCE)
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

// ✅ Handle preflight requests
app.options("*", cors());

// ✅ Middlewares
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// ✅ Connect DB
connectDB();

// ✅ Routes
import userRouter from "./src/routes/user.routes.js";
import contractRouter from "./src/routes/contract.routes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/elections", contractRouter);

// ✅ Root route
app.get("/", (req, res) => {
  res.send("Server is ready");
});

// ✅ Server start
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});