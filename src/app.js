import express from "express";
import dotenv from "dotenv";
import {MongoClient,ObjectId} from "mongodb";
import cors from "cors";
import joi from "joi";

const result = dotenv.config();
//config will read your .env file, parse the contents, assign it to process.env, and return an Object with a parsed key containing the loaded content or an error key if it failed.
if(result.error){
    console.log("Deu Algum Problema");
}
console.log(result.parsed);
//esse console.log vai me retornar a informação dentro do .env o que, no caso, se refere à connection String


//tem que lembrar de conectar com o MongoClient

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect(()=>{
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
    name: joi.string().required()
    // lastStatus: joi.number().required()
});

const messagesSchema = joi.object({
    from: joi.string().required(),
    to:joi.string().required(),
    text:joi.string().required(),
    type: joi.string().required(),
    time: joi.date().required()
});

app.get('/participants', async (req,res)=>{
try {
    const participants = await db.collection('participants').find().toArray();
    if(participants.length===0){
       res.send("Ainda não há participantes");
    }
    else{
        res.send(participants);
    }
}
catch (error){
    console.log(error);
    res.sendStatus(500);
}
});

// app.post('/participants', async (req,res)=>
// {
//     //Eu vou colocar minha validação dentro de um try/catch para evitar deixar meu código explodir por erros inesperados
//     try{
//         const user = req.body;
//         //com isso, estou pegando o usuário pelo post
//         const validation   = participantsSchema.validate(user);
//         //com isso, estou chamando a validação
//         if(validation.error){
//             res.status(422).send("Entidade não processável. Ou o formato está incorreto, ou faltou algum dado");
//             return
//         }
//         else{console.log("Validation ok")}

//         const participants = await db.collection('participants').insert(user);
//         res.status(200);
//         console.log(participants);
        
// }catch(error){
// console.log(error);
// res.sendStatus(500);
// }

// }
// );

// app.get('/participants', async (req,res)=> {

// });


// app.post('/messages', async (req,res)=> {

// });

// app.get('/messages', async (req,res)=> {

// });


// app.post('/status', async (req,res)=> {

// });

app.listen(5000,()=>{
    console.log("Server is running at http://localhost:5000/");
})