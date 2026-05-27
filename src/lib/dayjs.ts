import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const setDefaultTimezone = (tz: string) => {
  dayjs.tz.setDefault(tz);
};



export {default} from 'dayjs';