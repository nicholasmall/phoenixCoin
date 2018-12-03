"use strict";
/**
 *  不用了
 */
var conf = require("./conf");
var Mongo = require("./MongoDBUtils");
var flag = false;
var DB = new Mongo(conf.mongoConfig);

function PhoenixCoin() {
    this.baseMap = {};
}

PhoenixCoin.prototype.start = function (cb) {
    var self = this;
    var masterList = [];
    var addressList = [];
    DB.getMasterNodeLockedList(function (err, ML) {
        masterList = ML;
        self.endHandleExcel(function () {
            cb(masterList, addressList);
        });
    });
    DB.getAddressLockedList(function (err, AL) {
        AL.forEach(function (v) {
            var base = Math.round(v.lockedMonth / 6);
            if (self.baseMap[base]) {
                if (self.baseMap[base][v.address]) {
                    self.baseMap[base][v.address] += v.lockedVal;
                } else {
                    self.baseMap[base][v.address] = v.lockedVal;
                }
            } else {
                self.baseMap[base] = {};
                self.baseMap[base][v.address] = v.lockedVal;
            }
        });
        self.getAddressPhoenixData(function (list) {
            addressList = list;
            self.endHandleExcel(function () {
                cb(masterList, addressList);
            });
        });
    });
};

PhoenixCoin.prototype.getAddressPhoenixData = function (cb) {
    var self = this;
    var list = [];
    var baseKeys = Object.keys(self.baseMap);
    baseKeys.sort(function (m, n) {
        m = Number(m);
        n = Number(n);
        if (m > n) return -1;
        else if (m < n) return 1;
        else return 0
    });

    baseKeys.forEach(function (baseKey, i) {
        var addresses = self.baseMap[baseKey];
        var addressKeys = Object.keys(addresses);
        addressKeys.forEach(function (addressKey) {
            if (addresses[addressKey] >= 5000) {
                var rate = Math.round(addresses[addressKey] / 5000);
                list.push({
                    address: addressKey,
                    phoenixCoin: baseKey * rate,
                    lockedVal: rate * 5000,
                    lockedMonth: rate * 6
                });

                if (addresses[addressKey] % 5000 > 0) {
                    self.transferDownward(i, addressKey, addresses[addressKey] % 5000, baseKeys);
                }
            } else {
                self.transferDownward(i, addressKey, addresses[addressKey], baseKeys)
            }
        });
    });
    cb(list);
};

/**
 * 将当前倍率地址不足5000的向下一个倍率地址传递
 * @param i
 * @param address
 * @param val
 * @param baseKeys
 */
PhoenixCoin.prototype.transferDownward = function (i, address, val, baseKeys) {
    var self = this;
    if (i < baseKeys.length - 1) {
        if (self.baseMap[baseKeys[i + 1]]) {
            if (self.baseMap[baseKeys[i + 1]][address]) {
                self.baseMap[baseKeys[i + 1]][address] += val;
            } else {
                self.baseMap[baseKeys[i + 1]][address] = val;
            }
        }
    }
};

PhoenixCoin.prototype.endHandleExcel = function (cb) {
    if (flag) {
        cb();
    } else {
        flag = true;
    }
};

module.exports = PhoenixCoin;