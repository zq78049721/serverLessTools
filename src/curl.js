import fetch from 'node-fetch'

function urlMerage(url, urlParams) {
    if (!urlParams || urlParams.length <= 0) {
        return url;
    }
    let paramsArray = [];
    for (let key in urlParams) {
        let value = urlParams[key];
        paramsArray.push(`${key}=${encodeURI(value)}`);
    }
    return `${url}?${paramsArray.join('&')}`;
}

async function reqeusting(url, params = { method: "GET" }) {
    return fetch(url, {
        contentType: 'json',
        ...params
    }).then(async res =>{
        const data=await res.json();
        return {
            status:res.status,
            data
        };
    });
}

function create() {
    async function get({ url, urlParams }) {
        return reqeusting(urlMerage(url, urlParams), {
            method: 'GET',
        })
    }
    async function post({ url, data, urlParams }) {
        return reqeusting(urlMerage(url, urlParams), {
            method: 'POST',
            data
        })
    }
    async function put({ url, data, urlParams }) {
        return reqeusting(urlMerage(url, urlParams), {
            method: 'PUT',
            data
        })
    }
    return {
        get,
        post,
        put
    }
}

export default create