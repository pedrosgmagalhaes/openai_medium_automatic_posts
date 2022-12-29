const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const feedsRouter = require('./src/routes/feeds/');
const mediumRouter = require('./src/routes/medium/');
const mongodb = require('mongodb');

const app = express();

// Connection URL
const url = process.env.MONGO_URI;

// Create a new MongoClient
const client = new mongodb.MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

try {
    // Use connect method to connect to the Server
    client.connect();
    console.log('Connected to MongoDB');
} catch (error) {
    console.error(error);
}

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

app.use('/api/feeds', feedsRouter);
app.use('/api/medium', mediumRouter);

app.listen(8080, () => {
    console.log('Express app listening on port 8080');
});