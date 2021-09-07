function handlerList() {
    let list = [];
    function add(handler) {
        list.push(handler);
    }

    function remove(handler) {
        list = list.filter(h => h != handler)
    }

    async function intercept() {
        let result = arguments[0];
        for (let index in list) {
            result = await list[index](result, arguments[1]) || result;
        }
        return result
    }

    return {
        add,
        remove,
        intercept
    }
}


export default function () {
    const request = handlerList();
    const response = handlerList();
    return {
        requestIntercept: request.intercept,
        responseIntercept: response.intercept,
        requestBeforeUse: request.add,
        responseAfterUse: response.add,
        removeRequestBeforeUse: request.remove,
        removeResponseAfterUse: response.remove,
    }
}