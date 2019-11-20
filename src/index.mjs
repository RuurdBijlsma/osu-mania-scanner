import * as path from 'path';
import fs from 'fs';
import unzipper from 'unzipper';
import parser from 'osu-parser';

const folder = './songs/';

fs.readdir(folder, async (err, files) => {
    if (err)
        return console.log(err);

    let promises = files.map(async file => {
        let filePath = path.join(folder, file);
        return await checkOszForMania(filePath);
    });

    let isManiaFile = await Promise.all(promises);
    for (let i = 0; i < files.length; i++)
        if (!isManiaFile[i]) {
            let file = path.join(folder, files[i]);
            console.log("DELETING", file);
            fs.unlink(file, err => {
                if (err)
                    console.log(err);
                else
                    console.log("DELETED", file);
            });
        }
});

async function checkOszForMania(oszPath) {
    return new Promise(async (resolve, reject) => {

        let isManiaBeatMap = false;

        fs.createReadStream(oszPath)
            .pipe(unzipper.Parse())
            .on('entry', entry => {
                if (isManiaBeatMap) {
                    entry.autodrain();
                    return;
                }
                if (entry.type === 'File' && path.extname(entry.path) === '.osu') {
                    // This is an osu beat map file
                    parser.parseStream(entry, (err, beatMap) => {
                        if (err)
                            reject(err);
                        else if (beatMap.Mode === '3') {
                            isManiaBeatMap = true;
                            resolve(true);
                        }
                    });
                } else {
                    entry.autodrain();
                }
            }).on('finish', () => resolve(isManiaBeatMap));
    });
}