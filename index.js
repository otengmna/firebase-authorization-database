
const functions = require('firebase-functions');
const app = require('express')();

const cors = require('cors');

const userRouter = require('./routers/user-router');
const carRouter = require('./routers/car-router');


app.use(cors({ origin: true }));

app.use('/userAPI', userRouter);

app.use('/carAPI', carRouter);


exports.api = functions.https.onRequest(app);