'use strict';

const querystring = require('querystring');
const https = require('https');
const url = require('url');

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
                Origin: 'https://download.mokeedev.com',
                Referer: 'https://download.mokeedev.com',
                'Content-Type': 'application/x-www-form-urlencoded',
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

const deviceReg = /<li id="device_([^"]+)">[^<]+[^>]+><span>([^<]+)<\/span><\/a>/g;

async function getDevices() {
    const downloadPage = await get('https://download.mokeedev.com/');
    let r;
    while (r = deviceReg.exec(downloadPage)) {
        console.log(`code: ${r[1]} name: ${r[2]}`);
    }
}

function getLink(key) {
    return post('https://download.mokeedev.com/link.php', { key });
}

const downloadReg = /<td><a href="javascript:downloadPost\('download.php', ?{key:'([^']+)'}\)" id="tdurl">([^<]+)<\/a?><br ?\/><small>md5sum: ([^&]+)&nbsp;<a href="([^"]+)">([^<]+)<\/a><\/small><\/td>/g;

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

const otaReg = /<tr>[^<]+<td><a href="javascript:downloadPost\('download.php', ?{key:'([^']+)'}\)" id="tdurl">([^<]+)<\/a><br\/><small>md5sum: ([^<]+)<\/small><\/td>[^<]+<td>([^<]+)<\/td>/g;

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

getFullPakcages('bacon').then(arr => {
    getOtaPackages(arr[0].ota).then(async arr2 => {
        arr2.forEach(async a => {
            console.log(a);
            console.log(await getLink(a.key));
        });
    });
});
