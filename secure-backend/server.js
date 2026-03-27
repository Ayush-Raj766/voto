import express from "express"
import dotenv from "dotenv"
import connectDB from "./src/db/connectDb.js"
import cors from "cors"
import cookieParser from "cookie-parser"
import path from "path"

const app = express()

dotenv.config({
  path: "./.env"
})

// ✅ Connect DB
connectDB()

// ✅ Allowed origins
const allowedOrigins = [
  "http://localhost:8080",
  "http://localhost:5173",
  "http://localhost:3000",
  "https://voto-livid.vercel.app",
  ...(process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : [])
]

// ✅ CORS options (cleaned)
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      console.warn(`Blocked by CORS: origin='${origin}'`)
      callback(new Error("Not allowed by CORS"))
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  credentials: true,
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions))

// ✅ Middlewares
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"))
app.use(cookieParser())

// ✅ Routes
import userRouter from "./src/routes/user.routes.js"
import contractRouter from "./src/routes/contract.routes.js"

app.use("/api/v1/users", userRouter)
app.use("/api/v1/elections", contractRouter)

// ---------Deployment Code---------
const _dirname1 = path.resolve()

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(_dirname1, "frontend/dist")))

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(_dirname1, "frontend", "dist", "index.html"))
  })
} else {
  app.get("/", (req, res) => {
    res.send("Server is ready")
  })
}
//------------------------------------------------

// ✅ Server start
const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})