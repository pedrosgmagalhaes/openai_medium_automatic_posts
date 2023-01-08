const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const feedsRouter = require('./src/routes/feeds/');
const authRouter = require('./src/routes/auth/');
const mediumRouter = require('./src/routes/medium/');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const app = express();

// Load environment variables from .env file
dotenv.config();

// Connection URL
const { MONGO_URI } = process.env;


// Create a new MongoClient
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error) => {
        console.error(error);
    });


app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(session({
    secret: 'OMAPS-FGT764',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
}));

// Use body-parser as a middleware
app.use(bodyParser.json());

app.use('/api/auth', authRouter);
app.use('/api/feeds', feedsRouter);
app.use('/api/medium', mediumRouter);

app.listen(8080, () => {
    console.log('Express app listening on port 8080');
});