const express = require("express")
const mongoose = require ("mongoose")
const dotenv = require("dotenv")
const User = require("./models/userModel")
const routes = require("./routes")
const cors = require("cors")
const cookieParser = require('cookie-parser')
const {flw} = require("../service/paymentService")





dotenv.config()
const app = express ()

app.use(express.json())
app.use(cors())
app.use(cookieParser());



const PORT = process.env.PORT || 5000

mongoose.connect(process.env.MONGODB_URL)
.then(()=>{
    console.log("MongoDB connected...");
    
    app.listen(PORT, ()=>{
        console.log(`Server started on Port ${PORT} `);
})
})

app.use(routes)


  
  
  
  
