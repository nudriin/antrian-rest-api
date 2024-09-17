import { z } from 'zod';

export class QueueValidation {
    static readonly SAVE = z.object({
        locket_id: z.coerce.number().min(1),
    });

    static readonly GET = z.coerce.number().min(1);
}
