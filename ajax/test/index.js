const {curl}=require('../dist/serverLessTools');

const {get}=curl();
async function request(){
    const result=await get({url:"http://api.gupiao.zhuqingtools.com/solutions"});
    console.info(result)
}

request();