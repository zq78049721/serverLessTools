function isEmpty(value){
    return value==undefined || value==null;
}

function isSomeEmpty(values){
    for(let index in values){
        let value=values[index];
        if(isEmpty(value)){
            return true;
        }
    }
    return false;
}

function isAllEmpty(values){
    for(let index in values){
        let value=values[index];
        if(!isEmpty(value)){
            return false;
        }
    }
    return true;
}


export default {
    isEmpty,
    isSomeEmpty,
    isAllEmpty
}