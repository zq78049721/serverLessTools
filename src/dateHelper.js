import moment from 'moment';

export default {
    currentDate(){
        return moment().format("YYYY-MM-DD");
    },

    currentHour(){
        return moment().format("HH");
    },

    convertDate(obj,format){
        return moment(obj).format(format || "YYYY-MM-DD")
    }
}