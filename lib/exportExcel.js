"use strict";
var conf = require("./conf");
var Mongo = require("./MongoDBUtils");
var ExcelUtsil = require("../route/ExcelUtils");

var flag = false;
var DB = new Mongo(conf.mongoConfig);
var EU = new ExcelUtsil();

DB.getMasterNodeLockedList(function (err, ML) {
    EU.setColumns(1, "masterNodePhoenixCoin");
    // 手动写入共用相同地址的主节点 后期是否删除还不确定
    ML.unshift({
        _id: '2ff032c5fb796ba509e0853776bcb01183c12a959fd07f1749eca6568d4be032-1',
        txid: '2ff032c5fb796ba509e0853776bcb01183c12a959fd07f1749eca6568d4be032',
        address: 'XuSD6ZDzMz3F243UYMyifRkq38qddMnQtr',
        lockedVal: 1000,
        lockedMonth: 6,
        time: 1536630467,
        phoenixCoin: 1,
        onlyKey: '2ff032c5fb796ba509e0853776bcb01183c12a959fd07f1749eca6568d4be032_XuSD6ZDzMz3F243UYMyifRkq38qddMnQtr_1'
    });
    EU.toExcel(ML, function () {
        console.log("master node excel done");
        endHandleExcel();
    })
});

DB.getAddressLockedList(function (err, AL) {
    EU.setColumns(2, "addressPhoenixCoin");
    EU.toExcel(AL, function () {
        console.log("address excel done");
        endHandleExcel();
    })
});

function endHandleExcel() {
    if (flag) {
        console.log(" all end ");
        process.exit()
    } else {
        flag = true;
    }
}