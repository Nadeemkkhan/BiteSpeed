import { AppDataSource } from "../config/database";
import { Contact } from "../entities/Contact";
import { Repository } from "typeorm";

class IdentifyServiceError extends Error {
    cause?: Error;

    constructor(message: string, originalError?: unknown) {
        super(message);
        this.name = "IdentifyServiceError";

        if (originalError instanceof Error) {
            this.cause = originalError;
        }
    }
}

interface IdentifyResult {
    primaryContactId: number | null;
    emails: string[];
    phoneNumbers: string[];
    secondaryContactIds: number[];
}

export class IdentifyService {
    private contactRepo: Repository<Contact>;

    constructor() {
        this.contactRepo = AppDataSource.getRepository(Contact);
    }

    async identifyCustomer(email?: string, phoneNumber?: string): Promise<IdentifyResult> {
        return AppDataSource.transaction(async (transactionalEntityManager) => {
            try {
                if (!email && !phoneNumber) {
                    throw new IdentifyServiceError("Email or phoneNumber are required");
                }

                const existingContacts = await transactionalEntityManager.find(Contact, {
                    where: [{ email }, { phoneNumber }],
                });

                if (existingContacts.length === 0) {
                    const newContact = transactionalEntityManager.create(Contact, {
                        email,
                        phoneNumber,
                        linkPrecedence: "primary",
                    });
                    const savedContact = await transactionalEntityManager.save(newContact);

                    return {
                        primaryContactId: savedContact.id,
                        emails: email ? [email] : [],
                        phoneNumbers: phoneNumber ? [phoneNumber] : [],
                        secondaryContactIds: [],
                    };
                }

                let primaryContact = existingContacts.find(c => c.linkPrecedence === "primary");
                if (!primaryContact) {
                    primaryContact = existingContacts[0];
                    primaryContact.linkPrecedence = "primary";
                    await transactionalEntityManager.save(primaryContact);
                }

                const secondaryContacts = existingContacts.filter(c => c.id !== primaryContact.id);

                const existingEmails = new Set(existingContacts.map(c => c.email).filter(Boolean));
                const existingPhones = new Set(existingContacts.map(c => c.phoneNumber).filter(Boolean));

                let newSecondaryContact: Contact | undefined;

                if ((email && !existingEmails.has(email)) || (phoneNumber && !existingPhones.has(phoneNumber))) {
                    newSecondaryContact = transactionalEntityManager.create(Contact, {
                        email,
                        phoneNumber,
                        linkedId: primaryContact.id,
                        linkPrecedence: "secondary",
                    });
                    await transactionalEntityManager.save(newSecondaryContact);
                    secondaryContacts.push(newSecondaryContact);
                }

                for (const secondaryContact of secondaryContacts) {
                    secondaryContact.linkedId = primaryContact.id;
                    secondaryContact.linkPrecedence = "secondary";
                    await transactionalEntityManager.save(secondaryContact);
                }

                const emails = Array.from(new Set([primaryContact.email, ...existingEmails])).filter(Boolean) as string[];
                const phoneNumbers = Array.from(new Set([primaryContact.phoneNumber, ...existingPhones])).filter(Boolean) as string[];

                return {
                    primaryContactId: primaryContact.id,
                    emails,
                    phoneNumbers,
                    secondaryContactIds: secondaryContacts.map(c => c.id),
                };
            } catch (error) {
                console.error("❌ Error in identifyCustomer:", error);
                throw new IdentifyServiceError("Error identifying customer", error instanceof Error ? error : undefined);
            }
        });
    }

    async getAllCustomers(): Promise<Contact[]> {
        try {
            return await this.contactRepo.find(); // Fetch all contacts
        } catch (error) {
            console.error("❌ Error fetching all customers:", error);
            throw new IdentifyServiceError("Error fetching all customers", error);
        }
    }
}

export default new IdentifyService();
