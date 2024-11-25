"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeCachePoolData = exports.readCachePoolData = void 0;
const web3_js_1 = require("@solana/web3.js");
const jsonfile_1 = __importDefault(require("jsonfile"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const filePath = path_1.default.join(__dirname, '../data/pool_data.json');
const readCachePoolData = (cacheTime) => {
    let cacheData = {
        time: 0,
        ammPools: [],
        clmmPools: [],
        cpmmPools: [],
    };
    try {
        console.log('reading cache pool data');
        const data = jsonfile_1.default.readFileSync(filePath);
        if (Date.now() - data.time > (cacheTime !== null && cacheTime !== void 0 ? cacheTime : 1000 * 60 * 10)) {
            console.log('cache data expired');
            return cacheData;
        }
        cacheData.time = data.time;
        cacheData.ammPools = data.ammPools.map((p) => (Object.assign(Object.assign({}, p), { id: new web3_js_1.PublicKey(p.id), mintA: new web3_js_1.PublicKey(p.mintA), mintB: new web3_js_1.PublicKey(p.mintB) })));
        cacheData.clmmPools = data.clmmPools.map((p) => (Object.assign(Object.assign({}, p), { id: new web3_js_1.PublicKey(p.id), mintA: new web3_js_1.PublicKey(p.mintA), mintB: new web3_js_1.PublicKey(p.mintB) })));
        cacheData.cpmmPools = data.cpmmPools.map((p) => (Object.assign(Object.assign({}, p), { id: new web3_js_1.PublicKey(p.id), mintA: new web3_js_1.PublicKey(p.mintA), mintB: new web3_js_1.PublicKey(p.mintB) })));
        console.log('read cache pool data success');
    }
    catch (_a) {
        console.log('cannot read cache pool data');
    }
    return {
        ammPools: cacheData.ammPools,
        clmmPools: cacheData.clmmPools,
        cpmmPools: cacheData.cpmmPools,
    };
};
exports.readCachePoolData = readCachePoolData;
const writeCachePoolData = (data) => {
    console.log('caching all pool basic info..');
    fs_1.default.mkdir(path_1.default.join(__dirname, '../data'), (err) => {
        if (err) {
            return console.error(err);
        }
    });
    jsonfile_1.default
        .writeFile(filePath, {
        time: Date.now(),
        ammPools: data.ammPools.map((p) => ({
            id: p.id.toBase58(),
            version: p.version,
            mintA: p.mintA.toBase58(),
            mintB: p.mintB.toBase58(),
        })),
        clmmPools: data.clmmPools.map((p) => ({
            id: p.id.toBase58(),
            version: p.version,
            mintA: p.mintA.toBase58(),
            mintB: p.mintB.toBase58(),
        })),
        cpmmPools: data.cpmmPools.map((p) => ({
            id: p.id.toBase58(),
            version: p.version,
            mintA: p.mintA.toBase58(),
            mintB: p.mintB.toBase58(),
        })),
    })
        .then(() => {
        console.log('cache pool data success');
    })
        .catch((e) => {
        console.log('cache pool data failed', e);
    });
};
exports.writeCachePoolData = writeCachePoolData;
//# sourceMappingURL=utils.js.map