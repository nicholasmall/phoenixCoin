"use strict";
var MongoDB = require("mongoskin");

function MongoDBUtils(conf) {
    this.DB = MongoDB.db(conf.url, conf.options);
    this.DB.bind("block");
    this.DB.bind("masterNodeLocked");
    this.DB.bind("addressLocked");
}

/**
 * 得到已经获取过的区块高度
 * @param cb
 */
MongoDBUtils.prototype.getAlreadyObtainedHeight = function (cb) {
    this.DB.block.find({id: 1}).toArray(cb)
};

/**
 * 设置已经获取的区块高度
 * @param height
 * @param cb
 */
MongoDBUtils.prototype.setAlreadyObtainedHeight = function (height, cb) {
    this.DB.block.update({
            'id': 1
        }, {
            $set: {
                height: height
            }
        }, {upsert: true},
        function (err, result) {
            if (err) {
                return cb(err)
            }
            cb(null);
        }
    );
};

/**
 * 保存主节点锁定的数据
 * @param params
 * @param cb
 */
MongoDBUtils.prototype.saveMasterNodeLockedData = function (params, cb) {
    this.DB.masterNodeLocked.insert(params, cb)
};

/**
 * 保存地址锁定的数据
 * @param params
 * @param cb
 */
MongoDBUtils.prototype.saveAddressLockedData = function (params, cb) {
    this.DB.addressLocked.insert(params, cb)
};

//------------------------------------------  excel use ----------------------------------

MongoDBUtils.prototype.getMasterNodeLockedList = function (cb) {
    this.DB.masterNodeLocked.find()/*.sort({time: 1})*/.toArray(cb);
};

MongoDBUtils.prototype.getAddressLockedList = function (cb) {
    this.DB.addressLocked.find()/*.sort({time: 1})*/.toArray(cb);

    // this.DB.addressLocked.find().sort({time: 1, address: 1, lockedMonth: 1}).toArray(cb);
    // this.DB.addressLocked.aggregate([{$match: {lockedMonth: month}}, {
    //     $group: {
    //         _id: "$address",
    //         lockedVal: {$sum: "$lockedVal"}
    //     }
    // }], cb);

};

module.exports = MongoDBUtils;