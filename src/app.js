import express from "express";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import joi from "joi";
import dayjs from "dayjs";

const result = dotenv.config();
if (result.error) {
  console.log("Houve algum problema");
}

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect(() => {
  db = mongoClient.db("projeto12_batePapoUol");
});

const app = express();
app.use(express.json());
app.use(cors());

const participantsSchema = joi.object({
  name: joi.string().required(),
});

const messagesSchema = joi.object({
  to: joi.string().required(),
  text: joi.string().required(),
  type: joi.string().valid("message", "private_message").required(),
});

app.get("/participants", async (req, res) => {
  try {
    const participants = await db.collection("participants").find().toArray();
    if (participants.length === 0) {
      res.send("Ainda não há participantes!");
    } else {
      res.send(participants);
    }
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

app.post("/participants", async (req, res) => {
  const user = req.body;
  const participants = await db.collection("participants").find().toArray();

  try {
    const validation = participantsSchema.validate(user);

    if (validation.error) {
      return res
        .status(422)
        .send(
          "Entidade não processável. Ou o formato está incorreto, ou faltou algum dado"
        );
    }

    for (let i = 0; i < participants.length; i++) {
      if (participants[i].name === user.name) {
        return res.status(418).send("Nome já em uso");
      }
    }
    let loggedUser = {
      name: user.name,
      lastStatus: Date.now(),
    };
    await db.collection("participants").insertOne(loggedUser);
    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

app.get("/messages", async (req, res) => {
  let currentUser = req.headers.user;
  let latestMessages;
  let limit;
  const messagesLimit = parseInt(req.query.limit);

  if (!messagesLimit) {
    limit = 100;
  } else {
    limit = messagesLimit;
  }

  try {
    let messages = await db.collection("messages");

    let historyMessages = await messages
      .find({
        $or: [
          { type: "message" },
          { $and: [{ type: "private_message" }, { to: currentUser }] },
          { $and: [{ type: "private_message" }, { from: currentUser }] },
        ],
      })
      .toArray();
    if (historyMessages.length > limit) {
      latestMessages = historyMessages.slice(-limit);
    } else {
      latestMessages = historyMessages;
    }
    res.send(latestMessages);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

app.post("/messages", async (req, res) => {
  const messageFrom = req.headers.user;
  const messageContent = req.body;
  const participants = await db.collection("participants");

  let userAuthorization = await participants.findOne({ name: messageFrom });

  try {
    if (!userAuthorization) {
      return res
        .status(409)
        .send(
          "Confira se realizou o login e está on-line antes de enviar mensagem"
        );
    }

    const validation = messagesSchema.validate(messageContent);
    if (validation.error) {
      return res
        .status(422)
        .send(
          "Entidade não processável. Ou o formato está incorreto, ou faltou algum dado"
        );
    }

    let messageTime = dayjs().format("HH:mm:ss");
    let sentMessage = {
      from: messageFrom,
      to: messageContent.to,
      text: messageContent.text,
      type: messageContent.type,
      time: messageTime,
    };

    await db.collection("messages").insertOne(sentMessage);
    res.sendStatus(201);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

app.post("/status", async (req, res) => {
  let userStatus = false;
  let currentUser = req.headers.user;
  let currentParticipants = await db
    .collection("participants")
    .find()
    .toArray();
  let documentcurrentParticipants = await db.collection("participants");

  let currentId;

  for (let i = 0; i < currentParticipants.length; i++) {
    if (currentParticipants[i].name === currentUser) {
      userStatus = true;
      currentId = currentParticipants[i]._id;
      break;
    }
  }
  try {
    if (!userStatus) {
      console.log("Usuário não está na lista");
      res.sendStatus(404);
    }

    let currentTimeStamp = Date.now();

    await documentcurrentParticipants.updateOne(
      {
        _id: ObjectId(currentId),
      },
      { $set: { lastStatus: currentTimeStamp } }
    );
    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

let intervalID = setInterval(checkParticipants, [15000]);

async function checkParticipants() {
  try {
    let participantList = await db.collection("participants");
    let participantsArray = await participantList.find().toArray();
    let originalLength = participantsArray.length;
    let timeNow = Date.now();
    for (let i = 0; i < originalLength; i++) {
      let difference = Math.abs(
        parseInt(participantsArray[i].lastStatus) - parseInt(timeNow)
      );
      if (difference > 100) {
        let id = participantsArray[i]._id;
        let logOutDocument = await participantList
          .find({ _id: ObjectId(id) })
          .toArray();

        let logOutName = logOutDocument[0].name;

        let logOutMessage = {
          from: "xxx",
          to: "Todos",
          text: `${logOutName} sai da sala...`,
          type: "status",
          time: timeNow,
        };
        await db.collection("messages").insertOne(logOutMessage);
        participantList.deleteOne({ _id: ObjectId(id) });
      }
    }
  } catch (error) {
    console.log(error);
  }
}
app.listen(5000, () => {
  console.log("Server is running at http://localhost:5000/");
});
