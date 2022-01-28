import express from "express";
import dotenv from "dotenv";
import {MongoClient,ObjectId} from "mongodb";
import cors from "cors";

const result = dotenv.config();
//config will read your .env file, parse the contents, assign it to process.env, and return an Object with a parsed key containing the loaded content or an error key if it failed.
if(result.error){
    console.log("Deu Algum Problema");
}
console.log(result.parsed);
//esse console.log vai me retornar a informação dentro do .env o que, no caso, se refere à connection String

const app = express();
app.use(express.json());
//Tem que usar o json para que o express receba informações de uma forma que ele seja capaz de compreender
app.use(cors());
//O cors, ou Cross-Origin Sharing, permite o acesso a certos hosts. Basicamente, permite que quaisquer orignes além do seu próprio possam carregar e acessar recursos

//tem que lembrar de conectar com o MongoClient
const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

mongoClient.connect(()=>{
    db = mongoClient.db("projeto12_batePapoUol");
});

app.post('/participants', async (req,res)=>
{

}
);

app.get('/participants', async (req,res)=> {

});


app.post('/messages', async (req,res)=> {

});

app.get('/messages', async (req,res)=> {

});


app.post('/status', async (req,res)=> {

});

app.listen(5000,()=>{
    console.log("Server is running at http://localhost:5000/");
})