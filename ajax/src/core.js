import { urlReplace, jsonToUrlParams } from './util'
import interceptCreate from './interceptor'
import methodsCreate from './methods'

function createFetch({ requestIntercept, responseIntercept, $http }) {
    return async function fetch({ url, method, pathParams, urlParams, bodyParams, headers }) {
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
        }

        config = await requestIntercept(config)

        let response = null;
        try {
            response = await $http(config);
        } catch (error) {
            response = error.response;
        }


        // 响应拦截器
        response = await responseIntercept(response, config)

        return response;
    }
}

export default function ({ $http }) {
    const { requestIntercept, responseIntercept, ...others } = interceptCreate();
    const fetch = createFetch({
        requestIntercept,
        responseIntercept,
        $http
    })

    return {
        ...methodsCreate(fetch),
        ...others
    }
}