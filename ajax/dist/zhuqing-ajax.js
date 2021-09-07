'use strict';

const urlReg = new RegExp("\{[^\}]+\}", "g");

function urlReplace(url, pathParams) {
    if (!pathParams) {
        return url;
    }
    return url.replaceAll(urlReg, function (value) {
        const propName = value.replace("\{", "").replace("\}");
        return pathParams[propName];
    })
}

function jsonToUrlParams(json) {
    if (!json) {
        return ''
    }
    const groups = Object.keys(json).map(key => {
        const value = json[key];
        return `${key}=${encodeURIComponent(value)}`;
    });
    return groups && groups.length ? "?" + groups.join("&") : '';
}

function handlerList() {
    let list = [];
    function add(handler) {
        list.push(handler);
    }

    function remove(handler) {
        list = list.filter(h => h != handler);
    }

    async function intercept() {
        const result = arguments[0];
        for (let index in list) {
            result = await list[i](result, arguments[1]) || result;
        }
        return result
    }

    return {
        add,
        remove,
        intercept
    }
}


function interceptCreate () {
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

function createMethod({method,fetch}){
    return function(props){
        return fetch({
            ...props,
            method
        })
    }
}

function create(fetch){
    return {
        get:createMethod({fetch,method:"get"}),
        post:createMethod({fetch,method:'post'}),
        patch:createMethod({fetch,method:'patch'}),
        put:createMethod({fetch,method:'put'}),
        delete:createMethod({fetch,method:'delete'}),
    }
}

function createFetch({ requestIntercept, responseIntercept, $http }) {
    return async function fetch(url, method, pathParams, urlParams, bodyParams, headers) {
        let fullUrl = urlReplace(url, pathParams);
        if (urlParams) {
            fullUrl += jsonToUrlParams(urlParams);
        }

        let config = {
            url: fullUrl,
            method,
            data: bodyParams,
            headers: {
                ...headers,
                'Content-Type': 'application/json',
            }
        };

        config = await requestIntercept(config);

        let response = await $http(config);

        // 响应拦截器
        response = await responseIntercept(response, config);

        return response;
    }
}

function create$1 ({ $http }) {
    const { requestIntercept, responseIntercept, ...others } = interceptCreate();
    const fetch = createFetch({
        requestIntercept,
        responseIntercept,
        $http
    });

    return {
        ...create(fetch),
        ...others
    }
}

module.exports = create$1;
