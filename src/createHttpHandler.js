import respHelper from './respHelper';
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
        })
        await mw.next();
    }
}

export default {
    createHandler,
    authorization
}