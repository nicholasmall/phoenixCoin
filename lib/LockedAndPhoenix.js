"use strict";
var conf = require("./conf");
var async = require("async");
var MongoUtils = require("./MongoDBUtils");
var SafeRpc = require("safedsaferpc");

var startTimestamp = new Date().getTime();
var bTime = startTimestamp;

function LockedAndPhoenix() {
    this.startHeight = 935100;
    this.endHeight = 945030;
    this.nextStep = 935100 + 100;
    this.step = 100;
    this.masternodelist = {};
    this.DB = new MongoUtils(conf.mongoConfig);
    this.api = new SafeRpc(conf.apiConfig, 14);
}

LockedAndPhoenix.prototype.error = function (err, message) {
    console.error(err);
    console.error(message);
    process.exit();
};

LockedAndPhoenix.prototype.init = function () {
    var self = this;
    self.DB.getAlreadyObtainedHeight(function (err, result) {
        if (err) {
            return self.error(err, "get already obtained height err");
        }

        if (result && result[0]) {
            self.startHeight = result[0].height;
            self.nextStep = result[0].height + self.step;
        }
        console.log("current block height :" + self.startHeight);
        self.getLastBlockHeight()
    })
};

LockedAndPhoenix.prototype.getLastBlockHeight = function () {
    var self = this;
    self.api.safedCall("getinfo", function (err, info) {
        if (err) {
            self.error(err, "get info err ");
        }

        self.endHeight = info.result.blocks;
        console.log("now last block height is :" + self.endHeight);
        self.getMasterNodeList();
    })
};

/**
 * 处理主节点数据
 */
LockedAndPhoenix.prototype.getMasterNodeList = function () {
    var self = this;
    this.api.safedCall("masternodelist", "payee", function (err, list) {
        if (err) {
            self.error(err, "get master node list err");
        }
        list = list.result;
        var keys = Object.keys(list);
        keys.forEach(function (key) {
            self.masternodelist[list[key]] = key;
        });
        console.log("get and handle master node list for : " + keys.length);
        self.processControl();
    });
};

/**
 * 流程控制
 */
LockedAndPhoenix.prototype.processControl = function () {
    var self = this;
    var currTime = new Date().getTime();
    var processTime = currTime - bTime;
    var totalTime = getSpendTimeDesc(currTime - startTimestamp);
    if (self.startHeight <= self.endHeight) {
        if (self.startHeight >= self.nextStep) {
            self.DB.setAlreadyObtainedHeight(self.nextStep, function (err) {
                if (err) {
                    return self.error(err, "update async block height err");
                }
            });
            console.log("***********************************************************");
            console.log(`[${self.startHeight - self.step} - ${self.nextStep}] 同步结束 耗时：${processTime} 总运行时长 ${totalTime}`);
            console.log("***********************************************************");
            self.nextStep = self.startHeight + self.step;
            bTime = new Date().getTime();
        }
        self.getBlock(self.startHeight++);
    } else {
        console.log("***********************************************************");
        console.log(`[${self.startHeight - self.step} - ${self.endHeight}] 同步结束 耗时：${processTime} 总运行时长 ${totalTime}`);
        console.log("***********************************************************");
        self.DB.setAlreadyObtainedHeight(self.endHeight, function (err) {
            if (err) {
                return self.error(err, "update async block height err");
            }
        });
        console.log("all done,process closed now ");
        process.exit();
    }
};

LockedAndPhoenix.prototype.getBlock = function (height) {
    var self = this;
    self.api.safedCall("getblockhash", height, function (err, blockHash) {
        if (err) {
            self.error(err, "get block hash err : " + height);
        }
        self.api.safedCall("getblock", blockHash.result, function (err, block) {
            if (err) {
                self.error(err, "get block err : " + blockHash.result);
            }
            async.each(block.result.tx, function (txid, eachCB) {
                self.getTransaction(txid, eachCB);
            }, function () {
                self.processControl();
            })
        })
    })
};

/**
 * 获取交易详情，并判断是否属于锁定
 * @param txid
 * @param cb
 */
LockedAndPhoenix.prototype.getTransaction = function (txid, cb) {
    var self = this;
    self.api.safedCall("getrawtransaction", txid, 1, function (err, tx) {
        if (err) {
            self.error(err, "get transaction err : " + txid);
        }
        tx = tx.result;
        async.each(tx.vout, function (out, eachCB) {
            if (out.txType == 1 && out.unlockedHeight > 0 && out.value >= 1000) {
                var data = {
                    _id: txid + "_" + out.scriptPubKey.addresses[0] + "_" + out.n,
                    txid: txid,
                    address: out.scriptPubKey.addresses[0],
                    lockedVal: out.value,
                    lockedMonth: Math.round((out.unlockedHeight - (tx.locktime || self.startHeight )) / 17280),
                    time: tx.time
                };
                self.handelLockedData(data, eachCB);
            } else {
                eachCB()
            }
        }, function () {
            cb();
        })
    })
};

/**
 1.主节点列表---txId+index index(自增长INDEX) txId+index,地址   锁定金额 锁定时常（6 12以上） ,凤凰令数量
 2.锁定奖励表 ----excel
 2.1 从锁定表里找到 所有的锁定 地址 金额  锁定时长 凤凰令数量 ----去掉主节点列表地址 ,去掉此地址---XmVvAye4ph9s3M5AjrWDRFAzTKrkpwcHHR
 2.2 更新凤凰令数量
 1.地址金额是否大于10000
 1.1 锁定时长 >= 12  4凤凰令
 1.2 锁定时长 >=6 2凤凰令
 2.地址金额是否大于5000
 2.1 锁定时长>=12 2 凤凰令
 2.2 锁定时长>=6 1 凤凰令
 */
/**
 * 处理锁定数据
 * @param out
 * @param cb
 */
LockedAndPhoenix.prototype.handelLockedData = function (out, cb) {
    var self = this;
    if (this.masternodelist[out.address]) { //判断是不是主节点锁定
        if (out.lockedMonth >= 12) {
            out.phoenixCoin = 2;
        } else if (out.lockedMonth >= 6) {
            out.phoenixCoin = 1;
        } else if (out.lockedVal < 1000) {
            return cb();
        }
        out.onlyKey = out._id;
        out._id = this.masternodelist[out.address];
        this.DB.saveMasterNodeLockedData(out, function (err) {
            if (err) {
                if (err.code !== 11000) {
                    self.error(err, "save master node data err :" + JSON.stringify(out));
                }
            }
            cb();
        });
    } else if (out.address != "XmVvAye4ph9s3M5AjrWDRFAzTKrkpwcHHR") { //如果不是主节点 也不是自己的地址
        if (out.lockedVal >= 5000) {
            if (out.lockedMonth >= 6) {
                out.phoenixCoin = Math.round(out.lockedMonth / 6) * Math.round(out.lockedVal / 5000);
            } else {
                return cb();
            }
        } else {
            return cb();
        }
        this.DB.saveAddressLockedData(out, function (err) {
            if (err) {
                if (err.code !== 11000) {
                    self.error(err, "save address locked data err : " + JSON.stringify(out));
                }
            }
            cb();
        })
    } else {
        cb();
    }
};

function getSpendTimeDesc(time) {
    var h = parseInt(time / (60 * 60 * 1000));
    var m = parseInt((time - h * 60 * 60 * 1000) / (60 * 1000));
    var s = parseInt((time - h * 60 * 60 * 1000 - m * 60 * 1000) / (1000));
    return h + "小时" + m + "分钟" + s + "秒";
}

module.exports = LockedAndPhoenix;