import express from 'express';
import cors from "cors"
import pg from 'pg';

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

app.get('/categories', (req, res) => {
  connection.query('SELECT * FROM categories').then(categories => {
    res.send(categories.rows);
  });
});

app.listen(4000, () => {
  console.log('Server listening on port 4000.');
});
