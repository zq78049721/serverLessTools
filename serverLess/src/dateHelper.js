import moment, { duration } from 'moment';
moment.locale('zh-cn');
export default {
    currentDate(){
        return moment().utcOffset(8).format("YYYY-MM-DD");
    },

    currentHour(){
        return moment().utcOffset(8).format("HH");
    },

    convertDate(obj,format){
        let date= obj?moment().utcOffset(8):moment(obj);
        return date.format(format || "YYYY-MM-DD");
    },

    create(str){
        return str?moment(str):moment()
    },
    duration(value){
        return moment.duration(value);
    },
    howLong(value,type){
        let d= this.create()-this.create(value);
        return moment.duration(d).as(type);
    }
}