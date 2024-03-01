require('dotenv').config()
const nodeEnv = process.env.NODE_ENV;

// config dotenv by environment
require('dotenv').config({
    path: `.env.${nodeEnv}`
})

console.log('ENV:::', nodeEnv, ' PORT:::', process.env.PORT)
const PORT = process.env.PORT || 3055;

// start server nodejs
const app = require('./src/app');
const server =  app.listen(PORT, () => {
    console.log(`------::----${process.env.SERVICE_NAME} start with port ${PORT}`);
});

// const mongoose = require('mongoose')
const db = mongoose.connection;
mongoose.set('strictQuery', true);
mongoose.connect(`mongodb://admin:admin@localhost:27017/shopDEV`, { useNewUrlParser: true }).then(() => console.log('DB Connected!'));
db.on('error', (err) => {
    console.log('DB connection error:', err.message);
})

process.on('SIGINT', () => {
    server.close('Exit server express');
    // notify send (ping....)
});
