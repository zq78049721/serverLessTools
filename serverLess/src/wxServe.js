import curl from './curl';
import WXBizDataCrypt from './WXBizDataCrypt'
const {get}=curl();
async function getUserInfo({wxURL,appid,secret,js_code,encryptedData,iv}){
    let sessionData=await get({
        url:wxURL,
        urlParams:{
            appid,
            grant_type:'authorization_code',
            js_code,
            secret
        }
    })
    let session_key=sessionData.data.session_key;
    let pc = new WXBizDataCrypt(appid, session_key)
    var data = pc.decryptData(encryptedData , iv)
    return [data,session_key];
}

export default {
    getUserInfo,
    wxAPI:'https://api.weixin.qq.com/sns/jscode2session'
}
