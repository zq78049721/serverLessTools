const getRawBody = require('raw-body');

export default async function getBody(req) {
    return new Promise((r1, r2) => {
        getRawBody(req, function (err, data) {
            if (err) {
                r2(err)
            } else {
                const jsonData = JSON.parse(new Buffer(data).toString())
                r1(jsonData);
            }
        })
    })
}