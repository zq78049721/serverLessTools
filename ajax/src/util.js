const urlReg = new RegExp("\{[^\}]+\}", "g");

export function urlReplace(url, pathParams) {
    if (!pathParams) {
        return url;
    }
    return url.replaceAll(urlReg, function (value) {
        const propName = value.replace("\{", "").replace("\}");
        return pathParams[propName];
    })
}

export function jsonToUrlParams(json) {
    if (!json) {
        return ''
    }
    const groups = Object.keys(json).map(key => {
        const value = json[key];
        return `${key}=${encodeURIComponent(value)}`;
    })
    return groups && groups.length ? "?" + groups.join("&") : '';
}