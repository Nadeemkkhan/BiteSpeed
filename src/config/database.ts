import { DataSource } from "typeorm";
import { Contact } from "../entities/Contact";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: true, // Set to false in production! Use migrations!
    logging: false,
    entities: [Contact],
});

export const initializeDatabase = async () => {
    try {
        await AppDataSource.initialize();
        console.log("Database connected!");
    } catch (error) {
        console.error("Error connecting to database:", error);
        throw error;
    }
};
