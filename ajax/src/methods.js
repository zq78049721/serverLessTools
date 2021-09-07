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

export default create;
