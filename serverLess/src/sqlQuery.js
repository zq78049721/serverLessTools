import aliRds  from 'ali-rds'
import pageHelper from './pagerHelper';
import co   from  'co';

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
        const { limit, offset } = pageHelper.createQuery(pager);
        const querySql = mergeSqlAndProps(sql, {
            ...params,
        });

        const limitQuery=mergeSqlAndProps(querySql+" LIMIT @offset,@limit",{
            limit,
            offset
        })
        const pagerSql = convertPagerSql(querySql);
        const items = await _query(limitQuery,mysql);
        const countResult = await _query(pagerSql,mysql);
        return {
            items,
            pager: pageHelper.createResult(
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
            sqlArray=sql.split("VALUES")
        }
        let before=sqlArray[0];
        let after=sqlArray[1];

        let insertSqlArray=[];
        items.map(item=>{
            insertSqlArray.push(mergeSqlAndProps(after,{
                ...item
            }))
        })
        let execSql=`${before} values ${insertSqlArray.join(',')}`
        // console.info(execSql);
        const execObj=transaction?transaction:mysql;
        const result = await _query(execSql,execObj);
        return result;
    }

    async function update(sql,item,transaction){
        let sqlArray = sql.split("WHERE");
        if(sqlArray.length<2){
            sqlArray=sql.split("where")
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

export default create;
