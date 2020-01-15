import moment from 'moment';

export default {
    currentDate(){
        return moment().format("YYYY-MM-DD");
    },

    currentHour(){
        return moment().format("HH");
    },

    convertDate(obj){
        return moment(obj).format("YYYY-MM-DD")
    }
}