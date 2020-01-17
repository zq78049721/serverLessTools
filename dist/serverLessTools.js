'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var moment = _interopDefault(require('moment'));
var fs = _interopDefault(require('fs'));
var path = _interopDefault(require('path'));
var aliRds = _interopDefault(require('ali-rds'));
var co = _interopDefault(require('co'));
var fetch = _interopDefault(require('node-fetch'));

moment.locale('zh-cn');
var dateHelper = {
    currentDate(){
        return moment().utcOffset(8).format("YYYY-MM-DD");
    },

    currentHour(){
        return moment().utcOffset(8).format("HH");
    },

    convertDate(obj,format){
        return moment(obj).utcOffset(8).format(format || "YYYY-MM-DD")
    }
};

function getSql (fileName) {
    const fullPath = path.resolve(`./${fileName}`);
    return fs.readFileSync(fullPath, {
        encoding: 'utf8'
    });
}

const defaultPager = {
    pageSize: 9999,
    pageIndex: 0
};

var pagerHelper = {
    createQuery(pager = {}) {
        const { pageSize, pageIndex } = {
            ...defaultPager,
            ...pager
        };
        return {
            limit: pageSize,
            offset: pageSize * pageIndex,
        }
    },
    createResult(pager = {}, count) {
        const { pageSize, pageIndex } = {
            ...defaultPager,
            ...pager
        };

        return {
            pageSize,
            pageIndex,
            total: count
        }
    }
};

function setCommonHeader(resp){
    resp.setHeader("Cache-Control","no-cache");
    resp.setHeader('content-type', 'application/json');
}

function setBody(resp,body){
    resp.send(JSON.stringify(body));
}

var respHelper = {
    r201(resp){
        resp.setStatusCode(201);
        setCommonHeader(resp);
    },
    rSingle(resp,result,status){
        resp.setStatusCode(status || 200);
        setCommonHeader(resp);
        setBody(resp,result);
    },
    rList(resp,{items,pager},status){
        resp.setStatusCode(status || 200);
        setCommonHeader(resp);
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
};

async function _query(sql,mysql){
    return await co(function*() {
      return yield mysql.query(sql);
    });
}

function create(config){
    const mysql=aliRds(config);

    function mergeSqlAndProps(sql, param = {}) {
        let result = sql;
        let keys = Object.keys(param);
        for (let index in keys) {
            let value=param[keys[index]];
            if(value && value.in){
                let inCode=value.value.map(v=>`'${v}'`);
                inCode=`(${inCode.join(',')})`;
                result = result.replace(`@${keys[index]}`, inCode);
            }else{
                result = result.replace(`@${keys[index]}`, mysql.escape(param[keys[index]]));
            }
    
        }
        return result;
    }
    
    
    function convertPagerSql(sql) {
        let fromIndex = sql.toLowerCase().indexOf("from");
        let pagerSql = "select count(*) as count " + sql.substring(fromIndex);
        return pagerSql;
    }

    
    async function select(sql,params={},pager={}){
        const { limit, offset } = pagerHelper.createQuery(pager);
        const querySql = mergeSqlAndProps(sql, {
            ...params,
        });

        const limitQuery=mergeSqlAndProps(querySql+" LIMIT @offset,@limit",{
            limit,
            offset
        });
        const pagerSql = convertPagerSql(querySql);
        const items = await _query(limitQuery,mysql);
        const countResult = await _query(pagerSql,mysql);
        return {
            items,
            pager: pagerHelper.createResult(
                pager,
                countResult[0].count)
        };
    }

    async function selectOne(sql,params){
        const querySql = mergeSqlAndProps(sql, {
            ...params,
        });
        // console.info(querySql)
        const single =await _query(querySql,mysql);
        return single[0];
    }

    async function insert(sql,items,transaction){
        let sqlArray = sql.split("values");
        if(sqlArray.length<2){
            sqlArray=sql.split("VALUES");
        }
        let before=sqlArray[0];
        let after=sqlArray[1];

        let insertSqlArray=[];
        items.map(item=>{
            insertSqlArray.push(mergeSqlAndProps(after,{
                ...item
            }));
        });
        let execSql=`${before} values ${insertSqlArray.join(',')}`;
        // console.info(execSql);
        const execObj=transaction?transaction:mysql;
        const result = await _query(execSql,execObj);
        return result;
    }

    async function update(sql,item,transaction){
        let sqlArray = sql.split("WHERE");
        if(sqlArray.length<2){
            sqlArray=sql.split("where");
        }
        if(sql.indexOf("where")==-1 && sql.indexOf("WHERE")==-1){
            throw new error("update 必须带条件")
        }

        let execSql=mergeSqlAndProps(sql,{
            ...item
        });
        // console.info(execSql);
        const execObj=transaction?transaction:mysql;
        const result = await _query(execSql,execObj);
        return result;
    }

    function beginTransaction(){
        return co(function*() {
          return yield mysql.beginTransaction();
        });
    }

    return {
        select,
        selectOne,
        insert,
        update,
        beginTransaction
    }
}

function readSql(path){
    return fs.readFileSync(path,{
        encoding:'utf8'
    })
}

const getRawBody = require('raw-body');

async function getBody(req) {
    return new Promise((r1, r2) => {
        getRawBody(req, function (err, data) {
            if (err) {
                r2(err);
            } else {
                const jsonData = JSON.parse(new Buffer(data).toString());
                r1(jsonData);
            }
        });
    })
}

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

function create$1() {
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

const { error401 } = respHelper;

class MidWare {
    constructor(props) {
        this.methods = Array.from(props.methods);
        this.ctx = props.ctx;
    }

    async next() {
        let next = this.methods.shift();
        next(this.ctx, this.next.bind(this));
    }
}


function authorization(is) {
    return async function ({ req, resp, context }, next) {
        const headers = req.headers;
        const { authorization } = headers;
        if (authorization == is) {
            next();
        } else {
            error401(resp);
        }
    }

}


function createHandler(methods) {
    return async function (req, resp, context) {
        const mw = new MidWare({
            methods,
            ctx: {
                req,
                resp,
                context
            }
        });
        await mw.next();
    }
}

var HttpHelper = {
    createHandler,
    authorization
};

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


var emptyHelper = {
    isEmpty,
    isSomeEmpty,
    isAllEmpty
};

var index = {
    dateHelper,
    getSql,
    pagerHelper,
    respHelper,
    createMysql:create,
    readSql,
    getBody,
    curl: create$1,
    HttpHelper,
    emptyHelper
};

module.exports = index;
