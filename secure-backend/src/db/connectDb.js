import mongoose from "mongoose";


const connectDB=async()=>{
       
       
    try {
        const insatance=await mongoose.connect(`${process.env.MONGO_DB_URI}/voting_system`) 
        console.log(`Database Connected ${insatance.connection.host}`);
    
    } catch (error) {
        console.log("Mongo DB Connection error",error);
        process.exit(1);
        
    }

}

export default connectDB