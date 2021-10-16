import express from 'express';
import cors from "cors"
import pg from 'pg';
import Joi from 'joi';
import JoiDate from "@joi/date"

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

//-----------------------***************----------------------SCHEMAS--------------***********************************-----------------//

const categoriesSchema = Joi.object({
  name: Joi.string().min(1).max(30).required(),
  id: Joi.number().min(1).required()
})

const gamesSchema = Joi.object({
  name: Joi.string().min(1).max(30).required(),
  image: Joi.string().uri().required(),
  stockTotal: Joi.number().min(1).required(),
  categoryId: Joi.number().min(1).required(),
  pricePerDay: Joi.number().min(1).required(),
})

const extendedJoi = Joi.extend(JoiDate)

const customersSchema = Joi.object({
  name: Joi.string().min(1).max(30).required(),
  phone: Joi.string().pattern(/^[0-9]+$/).min(10).max(11).required(),
  cpf: Joi.string().pattern(/^[0-9]+$/).min(11).max(11).required(),
  birthday: extendedJoi.date().format('YYYY-MM-DD')
})

//-----------------------***************----------------------CATEGORIES--------***********************************-----------------//
app.get('/categories', (req, res) => {

  try{
    connection.query('SELECT * FROM categories').then(categories => {
      res.send(categories.rows);
    });
  } catch (error){
    res.sendStatus(500);
  }  
});

//SELECT games.*, categories.name AS "categoryName" FROM games JOIN categories ON games."categoryId" = categories.id;

app.post('/categories', async (req, res) => {
    const { name, id } = req.body;

    const categoriesData = { name, id }     

    const { error, value } = categoriesSchema.validate(categoriesData)
    if (error){
      console.log(error)
      return res.sendStatus(400);
    }

    try {
      //fazer uma busca no banco de dados para validar se o nome, vindo de rec, ja existe   
      //com o await enquanto não volta a promisse o codigo n continua 
      const result = await connection.query('SELECT name FROM categories WHERE name = $1;', [name])
      if(result.rows.length){
        res.sendStatus(409);
      } else {
      await connection.query('INSERT INTO categories (name) VALUES ($1);', [name]).then (result => {
          res.sendStatus(201);
      }
      )}  
    } catch (error) {
      res.sendStatus(500);
    }       
});

//-----------------------***************---------------------JOGOS---------***********************************-----------------//

app.get('/games', async (req, res) => {

  let name = req.query.name;

  try{
    if (!name || name.length === 0){   
      connection.query('SELECT games.*, categories.name AS "categoryName" FROM games JOIN categories ON games."categoryId" = categories.id;').then(games => {
          res.send(games.rows);
        });           
    } else {
        const result = await connection.query('SELECT games.*, categories.name AS "categoryName" FROM games JOIN categories ON games."categoryId" = categories.id WHERE games.name ilike($1)', [`${name}%`])
          res.send(result.rows);
    }
  } catch (error) {
    console.log(error)
    res.sendStatus(500);
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

  try{
    //validando se nome é novo ou se ja existe
    const resultName = await connection.query('SELECT name FROM games WHERE name = $1;', [name])
    if(resultName.rows.length){
      res.sendStatus(409); 
    } else {
    //validando id
    const resultId = await connection.query('SELECT id FROM categories WHERE id = $1;', [categoryId])
      if(resultId.rows.length){
        connection.query('INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5);', [name, image, stockTotal, categoryId, pricePerDay]).then (resultName => {
          res.sendStatus(201);
        })
    } else {
      res.sendStatus(400);
    }}
  } catch {
    res.sendStatus(500)
  } 
});

//-----------------------***************---------------------clientes---------***********************************-----------------//

app.get('/customers', async (req, res) => {
  let cpf = req.query.cpf;
  
  try{
    if (!cpf || cpf.length === 0){       
      connection.query('SELECT * FROM customers').then(customers => {
        return res.send(customers.rows);
      });
    } else {
      const result = await connection.query('SELECT * FROM customers WHERE cpf ilike($1)', [`${cpf}%`])
      return res.send(result.rows);
    }
  } catch {
    res.sendStatus(500)
  } 
});

app.get('/customers/:id', async (req, res) => {
  let id = req.params.id;

  try{    
    const result = await connection.query('SELECT * FROM customers WHERE id = $1;', [id])
    if(result.rows.length){
      return res.send(result.rows[0]);
    } else {
      return res.sendStatus(404)
    }    
  } catch {
    return res.sendStatus(500)
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

  let birthdayYear = (parseInt(birthday))
  let currentYear = 2021;                               

  if(currentYear - birthdayYear <= 0){
    return res.sendStatus(400);    
  }

  try{
    const resultCPF = await connection.query('SELECT cpf FROM customers WHERE cpf = $1;', [cpf])
      if(resultCPF.rows.length){
        return res.sendStatus(409) 
      } else {
        connection.query('INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4);', [name, phone, cpf, birthday]).then(customers => {
          res.sendStatus(201);
      }
    )};
  } catch {
    res.sendStatus(500)
  } 
})

app.put('/customers/:id', async (req, res) => {
  let id = req.params.id;

  const { name, phone, cpf, birthday } = req.body;  
  const customerData = { name, phone, cpf, birthday }    

  const { error, value } = customersSchema.validate(customerData)
  if (error){
    console.log(error)
    return res.sendStatus(400);
  }

  let birthdayYear = (parseInt(birthday))
  let currentYear = 2021;                               

  if(currentYear - birthdayYear <= 0){
    return res.sendStatus(400);    
  }

  try{    
    const result = await connection.query('UPDATE customers SET name = $1, phone = $2, cpf = $3, birthday = $4 WHERE id = $5;', [name, phone, cpf, birthday, id])
      res.sendStatus(200);
  } catch (error) {
    console.log(error)
    return res.sendStatus(500)
  } 
});

//-----------------------***************---------------------porta---------***********************************-----------------//

app.listen(4000, () => {
  console.log('Server listening on port 4000.');
});

   