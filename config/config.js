const mongoose = require("mongoose")
let url = "mongodb+srv://jubin:123@cluster0.gnqxh4o.mongodb.net/?retryWrites=true&w=majority"
const connectDB = () => {
    return mongoose.connect(url)
}

module.exports = connectDB;