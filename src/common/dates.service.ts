import { Injectable } from '@nestjs/common';
import * as moment from 'moment';

@Injectable()
export class DatesService {
    getToday() {
        return moment().format().slice(0, 10);
    }

    getTodayWithTime() {
        return moment().utc(true).local().format();
    }
}
