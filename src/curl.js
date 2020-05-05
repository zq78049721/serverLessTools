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
        let data=null;
        if(params.toText){
            data=await res.text();
        }else{
            data=await res.json();
        }
        // const data=await res.json();
        return {
            status:res.status,
            data
        };
    });
}

function create() {
    async function get({ url, urlParams,headers,toText }) {
        return reqeusting(urlMerage(url, urlParams), {
            method: 'GET',
            headers,
            toText
        })
    }
    async function post({ url, data, urlParams,headers,toText }) {
        return reqeusting(urlMerage(url, urlParams), {
            method: 'POST',
            body:JSON.stringify(data),
            headers,
            toText
        })
    }
    async function put({ url, data, urlParams,headers,toText }) {
        return reqeusting(urlMerage(url, urlParams), {
            method: 'PUT',
            body:JSON.stringify(data),
            headers,
            toText
        })
    }
    return {
        get,
        post,
        put
    }
}

export default create