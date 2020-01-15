'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var moment = _interopDefault(require('moment'));
var fs = _interopDefault(require('fs'));
var path = _interopDefault(require('path'));
var aliRds = _interopDefault(require('ali-rds'));
var co = _interopDefault(require('co'));

var dateHelper = {
    currentDate(){
        return moment().format("YYYY-MM-DD");
    },

    currentHour(){
        return moment().format("HH");
    },

    convertDate(obj){
        return moment(obj).format("YYYY-MM-DD")
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

var index = {
    dateHelper,
    getSql,
    pagerHelper,
    respHelper,
    sqlQuery: create,
    readSql
};

module.exports = index;
