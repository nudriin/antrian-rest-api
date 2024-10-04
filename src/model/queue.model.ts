export class QueueResponse {
    id: number;
    createdAt: Date;
    queue_number: number;
    status: string;
    updatedAt?: Date;
    locket_id: number;
    user_id: number;
}

export class QueueSaveRequest {
    locket_id: number;
}

export class QueueAggregateResponse {
    total?: number;
    currentQueue?: number;
    nextQueue?: number;
    queueRemainder?: number;
    locket_id: number;
}

export class QueueTotalStats {
    totalToday?: number;
    totalWeek?: number;
    totalMonth?: number;
    totalSemester?: number;
}

export class QueueDistributionByLocket {
    locket: string;
    count: number;
}

export class QueueStatsByLocketLastMonth {
    [key: string]: {
        [date: string]: number;
    };
}
