import mongoose from "mongoose";
import {config} from "dotenv";
config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/saas";


const connectDb = async () => {
    await mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("Connected to MongoDB")
    })
    .catch((err) => {
        console.log("Error connecting to MongoDB", err)
    })
}

export default connectDb;