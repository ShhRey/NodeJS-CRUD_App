const express = require('express');
const mongoose = require('mongoose');
const userRouter = require('./routes/userRoutes')
require('dotenv').config();

const app = express();
app.use(express.json());

const mongodb_uri = process.env.MONGODB_URI
const PORT = process.env.PORT

mongoose.connect(mongodb_uri, {useNewUrlParser: true})
const conn = mongoose.connection

conn.on('open', () => {
    console.log('Connected to MongDB Database !!');
});
 
app.use('/', userRouter);

app.listen(PORT, () => {
    console.log(`Server Running on http://localhost:${PORT}`)
})