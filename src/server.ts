import app from "./app";
import "reflect-metadata";
import { initializeDatabase } from "./config/database";

const PORT = process.env.PORT || 3000;



initializeDatabase()
    .then(() => {
        console.log("Database connected!");
        console.log(`⏳ Starting server on port ${PORT}...`);
        app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    })
    .catch(err => {
        console.error("❌ Error during server startup:", err);
        process.exit(1);
    });
