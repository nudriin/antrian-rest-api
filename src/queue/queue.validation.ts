import { z } from 'zod';

export class QueueValidation {
    static readonly SAVE = z.object({
        locket_id: z.number().min(1),
    });

    static readonly GET = z.number().min(1);
}
