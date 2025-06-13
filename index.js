const express = require("express")
const mongoose = require ("mongoose")
const dotenv = require("dotenv")
const User = require("./models/userModel")
const routes = require("./routes")
const cors = require("cors")
const cookieParser = require('cookie-parser')





dotenv.config()
const app = express ()

app.use(express.json())
app.use(cors())
app.use(cookieParser());

const Flutterwave = require('flutterwave-node-v3');
const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

const PORT = process.env.PORT || 5000

mongoose.connect(process.env.MONGODB_URL)
.then(()=>{
    console.log("MongoDB connected...");
    
    app.listen(PORT, ()=>{
        console.log(`Server started on Port ${PORT} `);
})
})

app.use(routes)


  
  
  
  
