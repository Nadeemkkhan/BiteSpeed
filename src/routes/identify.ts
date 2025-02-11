import express, { Request, Response } from 'express';
import { IdentifyService } from '../services/identifyService';

const identifyRoutes = (identifyService: IdentifyService) => {
    const router = express.Router();

    // Handle POST request for identifying customer
    router.post("/", async (req: Request, res: Response) => {
        const { email, phoneNumber } = req.body;

        if (!email && !phoneNumber) {
            return res.status(400).json({ error: "Email or phoneNumber are required in the request body." });
        }

        const result = await identifyService.identifyCustomer(email, phoneNumber);
        res.json(result);
    });

    // Handle GET request for identifying a customer OR fetching all customers
    router.get("/", async (req: Request, res: Response) => {
        const email = req.query.email as string | undefined;
        const phoneNumber = req.query.phoneNumber as string | undefined;

        try {
            if (!email && !phoneNumber) {
                // Fetch all customers if no email or phoneNumber is provided
                const allContacts = await identifyService.getAllCustomers();
                return res.json(allContacts);
            }

            const result = await identifyService.identifyCustomer(email, phoneNumber);
            res.json(result);
        } catch (error) {
            console.error("❌ Error in /identify GET route:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    });

   
    return router;
};

export default identifyRoutes;
