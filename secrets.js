const AWS = require('aws-sdk');
const { Sequelize, DataTypes } = require('sequelize');
const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = 3000;

AWS.config.update({
  region: 'us-east-1'
});

const secretsManager = new AWS.SecretsManager();

async function getDatabaseCredentials(secretName) {
  try {
    const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
    const secret = data.SecretString ? JSON.parse(data.SecretString) : null;
    return secret;
  } catch (err) {
    console.error('Error retrieving secret', err);
    throw err;
  }
}

async function initializeDatabase(secretName) {
  const credentials = await getDatabaseCredentials(secretName);

  const sequelize = new Sequelize(credentials.DB_SCHEMA, credentials.DB_USERNAME, credentials.DB_PASSWORD, {
    host: credentials.DB_HOST,
    dialect: 'mysql',
  });

  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }

  return sequelize;
}

async function main() {
  const sequelize = await initializeDatabase('coursedb/credentials');
  const Customer = sequelize.define('Customer', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {});

  app.use(bodyParser.json());

  sequelize.sync().then(() => {
    console.log('Database & tables created!');
  });

  app.post('/customers', async (req, res) => {
    try {
      const newCustomer = await Customer.create(req.body);
      res.status(201).json(newCustomer);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/customers', async (req, res) => {
    try {
      const customers = await Customer.findAll();
      res.status(200).json(customers);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

main();
