import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { IdentifyService } from './services/identifyService';
import identifyRoutes from './routes/identify';
import 'express-async-errors';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


import IdentifyServiceInstance from "./services/identifyService"
const identifyRouter = identifyRoutes(IdentifyServiceInstance); // Use the imported instance


app.use('/identify', identifyRouter);

app.get('/', (req, res) => {
    res.send('Welcome to the API!');
});

// Error-handling middleware (should be defined last)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
