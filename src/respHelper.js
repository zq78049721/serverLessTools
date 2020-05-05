
function setCommonHeader(resp){
    resp.setHeader("Cache-Control","no-cache")
    resp.setHeader('content-type', 'application/json');
}

function setBody(resp,body){
    resp.send(JSON.stringify(body));
}

export default {
    r201(resp){
        resp.setStatusCode(201);
        setCommonHeader(resp)
    },
    rSingle(resp,result,status){
        resp.setStatusCode(status || 200);
        setCommonHeader(resp)
        setBody(resp,result);
    },
    rList(resp,{items,pager},status){
        resp.setStatusCode(status || 200);
        setCommonHeader(resp)
        setBody(resp,{
            items,
            pager
        });
    },
    error400(resp,errorMessage){
        resp.setStatusCode(400);
        setBody(resp,{
            errorMessage
        });
    },
    error401(resp){
        resp.setStatusCode(401);
        setBody(resp,{
            errorMessage:"没有权限"
        });
    }
}