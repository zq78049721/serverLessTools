import fs from 'fs';

export default function(path){
    return fs.readFileSync(path,{
        encoding:'utf8'
    })
}