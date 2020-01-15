import fs from 'fs';
import path from 'path';

export default function (fileName) {
    const fullPath = path.resolve(`./${fileName}`);
    return fs.readFileSync(fullPath, {
        encoding: 'utf8'
    });
}