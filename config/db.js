const mongoose = require("mongoose");


exports.connectToDb=async()=>{
    try {
      const conn= await mongoose.connect(process.env.MONGO_URI)
      console.log("MongoDb connected" ,conn.connection.host);
      
        console.log("Connected to MongoDB");
    }
        catch (error) {
            console.log("Error connection to MongoDB:",error.message);
            process.exit(1)
            
        }
}