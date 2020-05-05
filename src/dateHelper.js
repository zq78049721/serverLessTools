import moment from 'moment';
moment.locale('zh-cn');
export default {
    currentDate(){
        return moment().utcOffset(8).format("YYYY-MM-DD");
    },

    currentHour(){
        return moment().utcOffset(8).format("HH");
    },

    convertDate(obj,format){
        return moment(obj).utcOffset(8).format(format || "YYYY-MM-DD")
    }
}