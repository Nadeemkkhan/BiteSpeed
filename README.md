# BiteSpeed
BiteSpeed API

Installation

Prerequisites

Node.js (>=14.x)

MySQL Database

Setup

Clone the repository:

git clone https://github.com/Nadeemkkhan/BiteSpeed.git
cd BiteSpeed

Install dependencies:

npm install cors dotenv express express-async-errors mysql2 reflect-metadata typeorm
npm install --save-dev @types/cors @types/express @types/node ts-node typescript

Create a .env file in the root directory and add your database credentials:

DB_HOST=your_database_host
DB_PORT=your_database_port
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
PORT=3000

Start the server:

npx ts-node src/server.ts

The server should now be running on http://localhost:3000. 🎉

