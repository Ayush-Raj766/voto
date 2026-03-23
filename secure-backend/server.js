import express from "express"
import cookieParser from "cookie-parser"
import dotenv from "dotenv"
import connectDB from "./src/db/connectDb.js"
import cors from "cors"



const app = express()
dotenv.config({
  path: "./.env"
})


var corsOptions = {
  origin: ["http://localhost:8080", "http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
  optionsSuccessStatus: 200
}
app.use(cors(corsOptions))
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"))
app.use(cookieParser())


connectDB()



//user Routes////
import userRouter from "./src/routes/user.routes.js"

app.use("/api/v1/users", userRouter)

import contractRouter from "./src/routes/contract.routes.js"
app.use("/api/v1/elections", contractRouter);






const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000'

app.listen(process.env.PORT || 3000, () => {
  console.log(`server is listening to the port ${API_BASE_URL}`)
})

app.get("/", (req, res) => {
  res.send("Server is ready");
});
