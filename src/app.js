import express from "express";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import joi from "joi";
import dayjs from "dayjs";

const result = dotenv.config();
//config will read your .env file, parse the contents, assign it to process.env, and return an Object with a parsed key containing the loaded content or an error key if it failed.
if (result.error) {
  console.log("Deu Algum Problema");
}
console.log(result.parsed);
//esse console.log vai me retornar a informação dentro do .env o que, no caso, se refere à connection String

//tem que lembrar de conectar com o MongoClient

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect(() => {
  db = mongoClient.db("projeto12_batePapoUol");
});
//Com isso, eu estou criando o meu banco de dados, que é mantido aberto usando o express(). O que está dentro do db é o nome que eu estou dando pro Banco de Dados em questão. Poderia ser qualquer nome, e o no momento que é nomeado ele passa a existir. A princípio, sendo feita a conexào de forma global, não é necessário o fechar, ele é fechado quando é fechada a aplicação, quando o express para de rodar

// db.createCollection('participants');
// db.createCollection('messages');
//tecnicamente, não precisa criar as coleções, estou fazendo só pra me ajudar  a pensar

const app = express();
app.use(express.json());
//Tem que usar o json para que o express receba informações de uma forma que ele seja capaz de compreender

app.use(cors());
//O cors, ou Cross-Origin Sharing, permite o acesso a certos hosts. Basicamente, permite que quaisquer orignes além do seu próprio possam carregar e acessar recursos

const participantsSchema = joi.object({
  name: joi.string().required(),
  // lastStatus: joi.number().required()
});

const messagesSchema = joi.object({
  to: joi.string().required(),
  text: joi.string().required(),
  type: joi.string().valid("message", "private_message").required(),
  //o .valid diz quais conteúdos de string serão aceitos
  // from: joi.string().required()
});
//A validação da mensagem não tem que incluir o tempo. Esse é adicopnado antes dele ser enviado para a coleção!

app.get("/participants", async (req, res) => {
  try {
    const participants = await db.collection("participants").find().toArray();
    if (participants.length === 0) {
      res.send("Ainda não há participantes");
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
  //Essa constante estava dentro do const. A vcoloquei para fora porque o post nào parava
  const participants = await db.collection("participants").find().toArray();
  //Eu transformo a minha co;leçào em uma rraya para poder a manipular "procurar"cosias dentro dela.

  try {
    //Eu vou colocar minha validação dentro de um try/catch para evitar deixar meu código explodir por erros inesperados
    const validation = messagesSchema.validate(user);

    //com isso, estou chamando a validação
    if (validation.error) {
      return res
        .status(422)
        .send(
          "Entidade não processável. Ou o formato está incorreto, ou faltou algum dado"
        );
    } else {
      console.log("First Validation ok");
    }

    for (let i = 0; i < participants.length; i++) {
      if (participants[i].name === user.name) {
        console.log("nome já em uso");
        return res.sendStatus(418);
        //Lembrete: quando der retunr, retornam também o send de erro para não ficar rodando a requisição pra sempre
      }
    }
    await db.collection("participants").insertOne(user);
    //Antes o await estava dentro de uma constante. Removi. Pelo visto deuc erto, mas não tenho certeza quanto ao porque
    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

app.post("/messages", async (req, res) => {
  const messageFrom = req.headers.user;
  //colocar validação para se esse for vazio
  const messageContent = req.body;
  try {
    const validation = messagesSchema.validate(messageContent);
    if (validation.error) {
      return res
        .status(422)
        .send(
          "Entidade não processável. Ou o formato está incorreto, ou faltou algum dado"
        );
    } else {
      console.log("First Validation ok");
    }
    //Agora, antes de inserir a mensagem direto na coleçào, ela precisa ser completada, com o header e com o timestamp.
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

// app.get('/messages', async (req,res)=> {

// });

// app.post('/status', async (req,res)=> {

// });

app.listen(5000, () => {
  console.log("Server is running at http://localhost:5000/");
});
