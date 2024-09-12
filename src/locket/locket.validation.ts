import { z } from 'zod';

export class LocketValidation {
    static readonly SAVE = z.object({
        name: z.string().min(1).max(225),
    });
}
