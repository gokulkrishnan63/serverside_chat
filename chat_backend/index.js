const express = require("express");
const mongoose = require("mongoose");
const bodyparser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const userRouter = require("./Routes/userRoutes");
const chatRoutes = require("./Routes/chatRoutes");
const messageRoutes = require("./Routes/messageRoutes");
// const schemaRouter = require('./Routes/routes')
const app = express();
app.use(cors({origin:"http://localhost:3000"}))
mongoose
  .connect(process.env.LOCAL_DB)
  .then((d) => {
    console.log("db connected ...");
  })
  .catch((e) => {
    "bad";
  });
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

app.use("/user", userRouter);
app.use("/chat",chatRoutes);
app.use("/message",messageRoutes);
// app.use('/router',schemaRouter)
app.listen(process.env.PORT || 7993, () => {
  console.log("server is running");
});
