import { z } from 'zod';

export class UserValidation {
    static readonly REGISTER = z.object({
        email: z.string().email().min(1).max(225),
        password: z.string().min(1).max(225),
        name: z.string().min(1).max(225),
    });
    static readonly LOGIN = z.object({
        email: z.string().email().min(1).max(225),
        password: z.string().min(1).max(225),
    });
}
