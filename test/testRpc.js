"use strict";

var conf = require("../lib/conf").mongoConfig;
var SafeApi = require("safedsaferpc");
var api = new SafeApi({
    host: "10.0.0.249",
    port: "5554"
}, 5);

//  XuSD6ZDzMz3F243UYMyifRkq38qddMnQtr 相同地址的主节点
/**
 * 2ff032c5fb796ba509e0853776bcb01183c12a959fd07f1749eca6568d4be032_1
 */

var MongoDB = require("mongoskin");

var DB = MongoDB.db(conf.url, conf.options);
DB.bind("masterNodeLocked");

var masterNodeJson = [];
getMasterNodeListForChian();

function getMasterNodeListForChian() {
    api.safedCall("masternodelist", "payee", function (err, list) {
        list = list.result;
        var keys = Object.keys(list);
        keys.forEach(function (key) {
            var address = list[key];
            if (masterNodeJson[address]) {
                console.log(address)
            }
            masterNodeJson[address] = key;
        });
        // getMasterNodeListForMongo();
    });
}
// getMasterNodeListForMongo();
function getMasterNodeListForMongo() {
    DB.masterNodeLocked.find({address:'Xf5UW4RzDNn3yJT2QkbhHLtRV3LZmn3QbU'}).toArray(function (err, result) {
        if (err) {
            console.log("1");
        }
        // console.log(result);
        contrast(result);
    })
}

function contrast(dbList) {
    dbList.forEach(function (v) {
        delete masterNodeJson[v.address];
    });
    console.log(masterNodeJson);
    process.exit();
}