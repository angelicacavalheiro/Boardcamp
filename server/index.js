import express from 'express';
import cors from "cors"
import pg from 'pg';
import joi from 'joi';

const { Pool } = pg;

const connection = new Pool({
    user: 'bootcamp_role',
    password: 'senha_super_hiper_ultra_secreta_do_role_do_bootcamp',
    host: 'localhost',
    port: 5432,
    database: 'boardcamp'
  });

const app = express();
app.use(express.json());

const customersSchema = joi.object({
  name: joi.string().min(1).max(30).required(),
  phone: joi.string().pattern(/^[0-9]+$/).min(10).max(11).required(),
  cpf: joi.string().pattern(/^[0-9]+$/).min(11).max(11).required(),
  birthday: joi.string().pattern(/^[0-9]{4}\-[0-9]{2}\-[0-9]{1,2}$/).required(),
})

const gamesSchema = joi.object({
  name: joi.string().min(1).max(30).required(),
  image: joi.string().uri().required(),
  stockTotal: joi.number().min(1).required(),
  categoryId: joi.number().min(1).required(),
  pricePerDay: joi.number().min(1).required(),
})

//-----------------------***************----------------------CATEGORIES--------***********************************-----------------//
app.get('/categories', (req, res) => {
  connection.query('SELECT * FROM categories').then(categories => {
    res.send(categories.rows);
  });
});

app.post('/categories', async (req, res) => {
    const { name } = req.body;

    if (!name || name.length === 0 ){
        return res.status(400).send('O nome não pode ser vazio!');
    }

    //com isso a gente consegue jogar toda a logica do erro pra uma zona segura, 
    //antes de fazer as validações de regras de negocios

    //exemplo, posso tirar depois
    try {
        const result = await connection.query('SELECT name FROM categories WHERE name = $1;', [name])
    } catch (error) {
        console.log(error.message)
        if(error.name === "ReferenceError") {
        res.status(500).send("esse erro eu ja n sei")
    } else {
        res.status(500).send("foi culpa do estagiario")
    }}

    //fazer uma busca no banco de dados para validar se o nome, vindo de rec, ja existe   
    //com o await enquanto não volta a promisse o codigo n continua 
    const result = await connection.query('SELECT name FROM categories WHERE name = $1;', [name])
    if(result.rows.length){
        res.status(409).send("Essa categoria ja existe")

    } else {
        await connection.query('INSERT INTO categories (name) VALUES ($1);', [name]).then (result => {
            res.sendStatus(201);
        }
    )}      
});

//-----------------------***************---------------------JOGOS---------***********************************-----------------//

app.get('/games', async (req, res) => {

  let name = req.query.name;

  if (!name || name.length === 0){   
      connection.query('SELECT * FROM games').then(games => {
          res.send(games.rows);
        });            
      
  } else {
      const result = await connection.query('SELECT * FROM games WHERE name ilike($1)', [`${name}%`])
        if (result.rows.length){
          res.send(result.rows);
        } else {
          res.send(`Não existe jogo começando com: ${name}`)
        }  
  }    

});
  
app.post('/games', async (req, res) => {
  const { name, image, stockTotal, categoryId, pricePerDay } = req.body;      

  const gamesData = { name, image, stockTotal, categoryId, pricePerDay  }     

  const { error, value } = gamesSchema.validate(gamesData)
  if (error){
    console.log(error)
    return res.sendStatus(400);
  }

  //validando se nome é novo ou se ja existe
  const resultName = await connection.query('SELECT name FROM games WHERE name = $1;', [name])
  if(resultName.rows.length){
    res.status(409).send("Esse nome ja existe")  
  } else {

  //validando id
  const resultId = await connection.query('SELECT id FROM categories WHERE id = $1;', [categoryId])
    if(resultId.rows.length){
      connection.query('INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5);', [name, image, stockTotal, categoryId, pricePerDay]).then (resultName => {
        res.sendStatus(201);
      })
    } else {
      res.status(400).send("O id pra essa categoria ainda não existe, ou esta errado")
    }}
});

//-----------------------***************---------------------clientes---------***********************************-----------------//

app.get('/customers', async (req, res) => {

  let cpf = req.query.cpf;

  if (!cpf || cpf.length === 0){   
    connection.query('SELECT * FROM customers').then(customers => {
      return res.send(customers.rows);
    });
  } 

  const result = await connection.query('SELECT * FROM customers WHERE cpf ilike($1)', [`${cpf}%`])
    if (result.rows.length){
      res.send(result.rows);
    } else {
      res.send(`Não existem usuários começando com o CPF: ${cpf}`)
    }  
});

app.post('/customers', async (req, res) => {
  const { name, phone, cpf, birthday } = req.body;  
  const customerData = { name, phone, cpf, birthday }     

  const { error, value } = customersSchema.validate(customerData)
  if (error){
    console.log(error)
    return res.sendStatus(400);
  }

  const resultCPF = await connection.query('SELECT cpf FROM customers WHERE cpf = $1;', [cpf])
      if(resultCPF.rows.length){
        res.status(409).send("Não foi possível cadastrar, esse CPF já esta cadastrado")  
      } else {
        connection.query('INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4);', [name, phone, cpf, birthday]).then(customers => {
          res.sendStatus(201);
      }
  )};  
})

//-----------------------***************---------------------porta---------***********************************-----------------//

app.listen(4000, () => {
  console.log('Server listening on port 4000.');
});

   