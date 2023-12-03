#!/bin/bash
apt-get update
curl -sL https://deb.nodesource.com/setup_18.x | bash -
apt-get install git nodejs -y
npm install pm2 -g

git clone https://github.com/MarcoreJS/sequelize-example.git

cd sequelize-example
npm install

pm2 start secrets.js --name "api-server"

pm2 startup systemd
pm2 save
