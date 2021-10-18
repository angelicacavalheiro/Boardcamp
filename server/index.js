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

const rentalsSchema = Joi.object({
  customerId: Joi.number().required(),
  gameId: Joi.number().required(),
  daysRented: Joi.number().required(),
})

//-----------------------***************----------------------CATEGORIES--------***********************************-----------------//
app.get('/categories', async (req, res) => {

  try{
    const result = await connection.query('SELECT * FROM categories')
      res.send(result.rows);
  } catch (error){
    res.sendStatus(500);
  }  
});

app.post('/categories', async (req, res) => {
    const { name, id } = req.body;

    const categoriesData = { name, id }     

    const { error, value } = categoriesSchema.validate(categoriesData)
    if (error){
      return res.sendStatus(400);
    }

    try {
      const result = await connection.query('SELECT name FROM categories WHERE name = $1;', [name])
      if(result.rows.length){
        res.sendStatus(409);
      } else {
      const result = await connection.query('INSERT INTO categories (name) VALUES ($1);', [name])
          res.sendStatus(201);
      }
    } catch (error) {
      res.sendStatus(500);
    }       
});

//-----------------------***************---------------------JOGOS---------***********************************-----------------//

app.get('/games', async (req, res) => {

  let name = req.query.name;

  try{
    if (!name || name.length === 0){   
      const result = await connection.query('SELECT games.*, categories.name AS "categoryName" FROM games JOIN categories ON games."categoryId" = categories.id;')
          res.send(result.rows);           
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
        const result = await connection.query('INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5);', [name, image, stockTotal, categoryId, pricePerDay])
          res.sendStatus(201);
      } else {
        res.sendStatus(400);
      }
    }
  } catch {
    res.sendStatus(500)
  } 
});

//-----------------------***************---------------------clientes---------***********************************-----------------//

app.get('/customers', async (req, res) => {
  let cpf = req.query.cpf;
  
  try{
    if (!cpf || cpf.length === 0){       
      const result = await connection.query('SELECT * FROM customers')
        return res.send(result.rows);
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
        const result = await connection.query('INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4);', [name, phone, cpf, birthday])
          res.sendStatus(201);
      }
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
    return res.sendStatus(500)
  } 
});

//-----------------------***************---------------------ALUGUEL---------***********************************-----------------//

app.post('/rentals', async (req, res) =>{
  const { customerId, gameId, daysRented } = req.body;
  const rentalsData = { customerId, gameId, daysRented } 
  const { error, value } = rentalsSchema.validate(rentalsData)
  if (error){
    return res.sendStatus(400);
  }

  let date = new Date().toLocaleDateString('en-CA');
  let rentDate = date;
  let originalPrice = 0;
  let stock = 0;
  let openRents = 0;  

  //verificar se gameId se refere a um jogo existente.
  try{
    const result = await connection.query('SELECT id FROM games WHERE id = $1;', [gameId])
    if(!result.rows[0]){
      return res.sendStatus(400)
    }
  } catch {
    res.sendStatus(500)
  }

  //verificar se customerId se refere a um cliente existente. Se não, deve responder com status 400
  try{
    const result = await connection.query('SELECT id FROM customers WHERE id = $1;', [customerId])
    if(!result.rows[0]){
      return res.sendStatus(400)
    }
  } catch {
    res.sendStatus(500)
  }

  //criando o valor de originalPrice
  try{
    const result = await connection.query('SELECT "pricePerDay" FROM games WHERE  id = $1;', [gameId]);
    originalPrice = daysRented * result.rows[0].pricePerDay;
  } catch (error){
    res.sendStatus(500)
  }   

  //valida se existem jogos disponiveis
  try{
    const result = await connection.query('SELECT "stockTotal" FROM games WHERE id = $1;', [gameId]);
    stock = result.rows[0].stockTotal;
  } catch (error){
    return res.sendStatus(500)
  } 

  try{
    const result = await connection.query('SELECT * FROM rentals WHERE "returnDate" is null AND "gameId" = $1;', [gameId]);
    openRents = result.rows.length;
  } catch (error){
    return res.sendStatus(500)
  }

  if(openRents >= stock){
    return res.sendStatus(400)
  } 

  //mandando a requisição  
  try{
    const result = await connection.query('INSERT INTO rentals ("customerId", "gameId", "rentDate", "daysRented", "originalPrice" ) VALUES ($1, $2, $3, $4, $5);', [customerId, gameId, rentDate, daysRented, originalPrice]);
      res.sendStatus(201);
  } catch (error){
    console.log(error)
    res.sendStatus(500)
  } 
});

app.get('/rentals', async (req, res) => {

  let customerID = req.query.customerId;
  let gameID = req.query.gameId;
  let result = "";

  try{

    if (customerID) {
      result = await connection.query(`
        SELECT 
          rentals.*,
          customers.id AS "idCustomer",
          customers.name AS "nameCustomer",
          games.id AS "idGame",
          games.name AS "nameGame",
          categories.id AS "categoryId",
          categories.name AS "categoryName"
          FROM rentals
          JOIN customers
            ON rentals."customerId" = customers.id 
          JOIN games 
            ON rentals."gameId" = games.id
          JOIN categories
            ON games."categoryId" = categories.id
          WHERE customers.id = $1;`, [customerID])
    } else if (gameID) {
      result = await connection.query(`
        SELECT 
          rentals.*,
          customers.id AS "idCustomer",
          customers.name AS "nameCustomer",
          games.id AS "idGame",
          games.name AS "nameGame",
          categories.id AS "categoryId",
          categories.name AS "categoryName"
          FROM rentals
          JOIN customers
            ON rentals."customerId" = customers.id 
          JOIN games 
            ON rentals."gameId" = games.id
          JOIN categories
            ON games."categoryId" = categories.id
          WHERE games.id = $1;`, [gameID])
    } else {
      result = await connection.query(`
        SELECT 
          rentals.*,
          customers.id AS "idCustomer",
          customers.name AS "nameCustomer",
          games.id AS "idGame",
          games.name AS "nameGame",
          categories.id AS "categoryId",
          categories.name AS "categoryName"
          FROM rentals
          JOIN customers
            ON rentals."customerId" = customers.id 
          JOIN games 
            ON rentals."gameId" = games.id
          JOIN categories
            ON games."categoryId" = categories.id;`)
    }
      const resultFormated = result.rows.map(r => (
        {
          id: r.id,
          customerId: r.customerId,
          gameId: r.gameId,
          rentDate: new Date(r.rentDate).toLocaleDateString('en-CA'),
          daysRented: r.daysRented,
          returnDate: r.returnDate,
          originalPrice: r.originalPrice,
          delayFee: r.delayFee,
          customer: {
           id: r.idCustomer,
           name: r.nameCustomer
          },
          game: {
            id: r.idGame,
            name: r.nameGame,
            categoryId: r.categoryId,
            categoryName: r.categoryName
          }
        }
      ));
  
    return res.send(resultFormated); 

  } catch {
    return res.sendStatus(500)
  } 
});

app.post('/rentals/:id/return', async (req, res) => {

  let id = req.params.id;
  let finalDate = new Date().toLocaleDateString('en-US');
  let finalDateConverted = new Date().toLocaleDateString('en-CA');
  let inicialDateConverted, days, dalayFee, daysRented, gameId, pricePerDay

  try{
    const result = await connection.query('SELECT "rentDate", "gameId", "daysRented" FROM rentals WHERE id = $1;', [id])
    daysRented =  parseInt(result.rows[0].daysRented)
    gameId = parseInt(result.rows[0].gameId)
    inicialDateConverted = result.rows[0].rentDate.toLocaleDateString('en-US')
    let difference = Math.abs(new Date(finalDate)-new Date(inicialDateConverted));
    days = difference/(1000 * 3600 * 24)
  } catch (error){
    res.sendStatus(500)
  }  

  try{
    const result = await connection.query('SELECT "pricePerDay" FROM games WHERE id = $1;', [gameId])
    pricePerDay = parseInt(result.rows[0].pricePerDay)
  } catch (error){
    res.sendStatus(500)
  }  

  if(days > daysRented) { 
    dalayFee = parseInt(pricePerDay * (days - daysRented)) 
  } else {
    dalayFee = 0; 
  }

  try{
    const result = await connection.query('UPDATE rentals SET "returnDate"= $1, "delayFee" = $2 WHERE id = $3;', [finalDateConverted, dalayFee, id]);
      res.sendStatus(200);
  } catch (error){
    res.sendStatus(500)
  }  
    
});

app.delete('/rentals/:id', async (req, res) => {
  let id = req.params.id;

  try{
    const result = await connection.query('SELECT id FROM rentals WHERE id = $1;', [id])
    if(result.rows.length){
      const result = await connection.query('SELECT "returnDate" FROM rentals WHERE id = $1;', [id])
      console.log(result.rows[0].returnDate)
      if(result.rows[0].returnDate){
        return res.sendStatus(400)
      } else {
        const result = await connection.query('DELETE FROM rentals WHERE id = $1;', [id]);
        return res.sendStatus(200)
      }
    } else {
      return res.sendStatus(404)
    }  
  } catch{
    res.sendStatus(500)
  } 
});

//-----------------------***************---------------------porta---------***********************************-----------------//

app.listen(4000, () => {
  console.log('Server listening on port 4000.');
});

   