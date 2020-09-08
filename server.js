// importing
//import express from "express";
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Messages = require("./dbMessages");
const Pusher = require("pusher");
const cors = require("cors");

dotenv.config({ path: `${__dirname}/config.env` });

// app config
const app = express();
const port = process.env.PORT || 8000;

const pusher = new Pusher({
  appId: "1068782",
  key: "d8f59c9f84a315857cf5",
  secret: "6e1b4aa5dd8f8b059f00",
  cluster: "ap2",
  encrypted: true,
});

// middleware
app.use(express.json());
app.use(cors());

// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader("Access-Control-Allow-Headers", "*");
//   next();
// });

// DB config
const connection_url = process.env.DATABASE;

mongoose.connect(connection_url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.once("open", () => {
  console.log("DB connected");

  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();

  changeStream.on("change", (change) => {
    //console.log("A change occured!", change);

    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("message", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        received: messageDetails.received,
      });
    } else {
      console.log("Error triggering Pusher");
    }
  });
});

// ????

// api route
app.get("/", (req, res) => res.status(200).send("hello world"));

app.get("/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;

  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

// Listen
app.listen(port, () => console.log(`Listening on localhost:${port}`));
