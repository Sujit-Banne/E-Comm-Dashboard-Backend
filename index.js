const express = require('express')
const app = express()
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const cors = require('cors')
const morgan = require('morgan')

const route = require('./routes/route')

app.use(express.json())
app.use(cors())
app.use(morgan('dev'))

dotenv.config()
const PORT = process.env.PORT
const MONGO_URI = process.env.MONGO_URI

//route
app.use('/', route)

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('connected to db');
        app.listen(PORT, () => {
            console.log(`server is running on port ${PORT}`);
        })
    }).catch(err => {
        console.log(err);
    })