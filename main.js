'use strict';

const querystring = require('querystring');
const https = require('https');
const url = require('url');

let cookie = '';

function get(u) {
    return new Promise((resolve, reject) => {
        https.get(u, res => {
            res.setEncoding('utf8');
            let rawData = '';
            res.on('error', reject);
            res.on('data', chunk => rawData += chunk);
            res.on('end', () => resolve(rawData.toString()));
        }).on('error', reject);
    });
}

function post(u, params) {
    const opt = url.parse(u);
    const payload = querystring.stringify(params);
    let rawData = '';
    return new Promise((resolve, reject) => {
        const request = https.request({
            path: opt.path,
            host: opt.host,
            method: 'POST',
            headers: {
                Cookie: cookie,
                Origin: 'https://download.mokeedev.com',
                Referer: 'https://download.mokeedev.com',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Content-Length': Buffer.byteLength(payload)
            }
        }, res => {
            res.setEncoding('utf8');
            res.on('error', reject);
            res.on('data', chunk => rawData += chunk);
            res.on('end', () => resolve(rawData.toString()));
        });
        request.write(payload);
        request.end();
    });
}

function getCookie() {
    return new Promise((resolve, reject) => {
        https.get('https://download.mokeedev.com/download.php', res => {
            cookie = res.headers['set-cookie'][0];
            console.log(`Got cookie: ${cookie}`);
            resolve(cookie);
        }).on('error', reject);
    });
}

const deviceReg = /<li id="device_([^"]+)">[^<]+[^>]+><span>([^<]+)<\/span><\/a>/g;

async function getDevices() {
    const downloadPage = await get('https://download.mokeedev.com/');
    let r;
    while (r = deviceReg.exec(downloadPage)) {
        console.log(`code: ${r[1]} name: ${r[2]}`);
    }
}

const realKeyReg = /\$\.post\("gen-link.php",{url:"(\w+)"}/;

async function getLink(key) {
    const html = await post('https://download.mokeedev.com/download.php', { key });
    const realKey = realKeyReg.exec(html)[1];
    const link = await post('https://download.mokeedev.com/gen-link.php', { url: realKey });
    return link;
}

const downloadReg = /<td><a href="javascript:void\(0\);" onclick="javascript:downloadPost\('download.php', ?{key:'([^']+)'}\)" id="tdurl">([^<]+)<\/a?><br ?\/><small>md5sum: ([^&]+)&nbsp;<a href="javascript:void\(0\);" onclick="location.href='([^"]+)'">([^<]+)<\/a><\/small><\/td>/g;

async function getFullPakcages(devId) {
    const downloadPage = await get('https://download.mokeedev.com/?device=' + devId);
    let res = [];
    let r;
    while (r = downloadReg.exec(downloadPage)) {
        res.push({
            key: r[1],
            file: r[2],
            md5: r[3],
            ota: `https://download.mokeedev.com/${r[4]}`
        });
    }
    return res;
}

const otaReg = /<tr>[^<]+<td><a href="javascript:void\(0\);" onclick="javascript:downloadPost\('download.php', ?{key:'([^']+)'}\)" id="tdurl">([^<]+)<\/a><br\/><small>md5sum: ([^<]+)<\/small><\/td>[^<]+<td>([^<]+)<\/td>/g;

async function getOtaPackages(otaLink) {
    const downloadPage = await get(otaLink);
    let res = [];
    let r;
    while (r = otaReg.exec(downloadPage)) {
        res.push({
            key: r[1],
            file: r[2],
            md5: r[3],
            size: r[4]
        });
    }
    return res;
}

(async function () {
    await getCookie();
    switch (process.argv[2]) {
        case 'dev':
        case 'device': {
            console.log(await getDevices());
            break;
        }
        case 'full':
        case 'full-pkg': {
            const device = process.argv[3];
            if (device) {
                console.log(await getFullPakcages(device));
            } else {
                console.log('ERROR: No device specificed.');
            }
            break;
        }
        case 'ota':
        case 'ota-pkgs': {
            const link = process.argv[3];
            if (link) {
                console.log(await getOtaPackages(link));
            } else {
                console.log('ERROR: No link specificed.');
            }
            break;
        }
        case 'link':
        case 'download': {
            const key = process.argv[3];
            if (key) {
                console.log(await getLink(key));
            } else {
                console.log('ERROR: No key specificed.');
            }
            break;
        }
        case '-h':
        case 'help':
        case '--help':
        default: {
            console.log(`Avaliable actions:
   dev | device             - view avaliavle devices
  full | full-pkg <device>  - get full packages key
   ota | ota-pkg <ota-url>  - get ota packages key
  link | download <key>     - get real download link
   help                     - display this message.`);
        }
    }
})();
