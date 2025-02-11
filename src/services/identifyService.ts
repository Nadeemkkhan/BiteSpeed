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
    primaryContactId: number;
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

                // Find all contacts with matching email or phone number
                const matchingContacts = await transactionalEntityManager.find(Contact, {
                    where: [{ email }, { phoneNumber }],
                });

                if (matchingContacts.length === 0) {
                    // No existing contact, create a new primary contact
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

                // Determine the primary contact
                let primaryContact = matchingContacts.find(c => c.linkPrecedence === "primary");

                if (!primaryContact) {
                    // If there's no primary, assign the first contact as primary
                    primaryContact = matchingContacts[0];
                    primaryContact.linkPrecedence = "primary";
                    await transactionalEntityManager.save(primaryContact);
                }

                // Collect all emails, phone numbers, and secondary contacts
                const emails = new Set<string>();
                const phoneNumbers = new Set<string>();
                const secondaryContactIds: number[] = [];

                for (const contact of matchingContacts) {
                    if (contact.id !== primaryContact.id) {
                        secondaryContactIds.push(contact.id);
                    }
                    if (contact.email) emails.add(contact.email);
                    if (contact.phoneNumber) phoneNumbers.add(contact.phoneNumber);
                }

                // If new email or phone is provided, check if it needs to be added as secondary
                let newSecondaryContact: Contact | undefined;

                if ((email && !emails.has(email)) || (phoneNumber && !phoneNumbers.has(phoneNumber))) {
                    newSecondaryContact = transactionalEntityManager.create(Contact, {
                        email,
                        phoneNumber,
                        linkedId: primaryContact.id,
                        linkPrecedence: "secondary",
                    });
                    await transactionalEntityManager.save(newSecondaryContact);
                    secondaryContactIds.push(newSecondaryContact.id);
                    if (email) emails.add(email);
                    if (phoneNumber) phoneNumbers.add(phoneNumber);
                }

                return {
                    primaryContactId: primaryContact.id,
                    emails: Array.from(emails),
                    phoneNumbers: Array.from(phoneNumbers),
                    secondaryContactIds,
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
