import mongoose from "mongoose";

// Serverless-safe connection caching: Vercel functions can be invoked many
// times against a "warm" container, and opening a brand-new MongoDB
// connection on every invocation exhausts connection limits fast. We cache
// the connection promise on the global object so repeat invocations in the
// same runtime reuse it instead of reconnecting.
let cached = global._mongooseConnection;

if (!cached) {
    cached = global._mongooseConnection = { conn: null, promise: null };
}

const connectDatabase = async () => {
    if (cached.conn) {
        return cached.conn;
    }

    const uri = process.env.DB_URI || process.env.MONGODB_URI;

    if (!uri) {
        throw new Error(
            "No MongoDB connection string found. Set DB_URI in your environment."
        );
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(uri).then((con) => {
            console.log(
                `MongoDB Database connected with HOST: ${con.connection.host}`
            );
            return con;
        });
    }

    cached.conn = await cached.promise;
    return cached.conn;
};

export default connectDatabase;
