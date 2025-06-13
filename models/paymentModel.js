const mongoose = require("mongoose")

const paymentSchema = new mongoose.Schema({
    user: { type: String, required: true},
    transactionId: { type: String, unique: true, required: true },
    tx_ref: String,
    amount: Number,
    currency: String,
    status: String,
   
  }, {timestamps: true})
   
const Payment = new mongoose.model('Payment', paymentSchema)

module.exports = Payment
  