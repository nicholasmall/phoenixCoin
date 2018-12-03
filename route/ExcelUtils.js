"use strict";

var Excel = require('exceljs');

function ExcelUtils() {
}

ExcelUtils.prototype.setColumns = function (type, fileName) {
    var self = this;
    this.workbook = new Excel.stream.xlsx.WorkbookWriter({
        filename: `./excelFile/${fileName +"_"+ this.formatTimestamp()}.xlsx`
    });
    this.worksheet = this.workbook.addWorksheet('Sheet');
    if (type == 1) {
        this.worksheet.columns = [
            {header: '唯一标识', key: 'onlyKey'},
            {header: '地址', key: 'address', width: 50},
            {header: '交易', key: 'txid', width: 70},
            {header: '锁定时间', key: 'lockedTime', width: 20},
            {header: '锁定金额', key: 'lockedVal', width: 15},
            {header: '锁定月份', key: 'lockedMonth', width: 10},
            {header: '凤凰令数', key: 'phoenixCoin', width: 10}
        ];
    } else if (type == 2) {
        this.worksheet.columns = [
            {header: '唯一标识', key: '_id'},
            {header: '地址', key: 'address', width: 50},
            {header: '交易', key: 'txid', width: 70},
            {header: '锁定时间', key: 'lockedTime', width: 20},
            {header: '锁定金额', key: 'lockedVal', width: 15},
            {header: '锁定月份', key: 'lockedMonth', width: 10},
            {header: '凤凰令数', key: 'phoenixCoin', width: 10}
        ];
    }
};

ExcelUtils.prototype.toExcel = function (data, cb) {
    var self = this;
    var count = 0;
    data.forEach(function (d) {
        count += d.phoenixCoin;
        d.lockedTime = self._formatTimestamp(new Date(d.time * 1000));
        self.worksheet.addRow(d).commit();
    });
    // self.worksheet.addRow({address: "总数", phoenixCoin: count}).commit();

    this.workbook.commit().then(cb);
};


ExcelUtils.prototype._formatTimestamp = function (date) {
    var year = date.getFullYear(),
        month = date.getMonth() + 1,//月份是从0开始的
        day = date.getDate(),
        hour = date.getHours(),
        min = date.getMinutes(),
        sec = date.getSeconds();
    return year + '-' + month + '-' + day + ' ' + hour + ':' + min + ':' + sec;
};

ExcelUtils.prototype.formatTimestamp = function () {
    var date = new Date();
    var year = date.getFullYear(),
        month = date.getMonth() + 1,//月份是从0开始的
        day = date.getDate();
    return year + '-' + month + '-' + day;
};

module.exports = ExcelUtils;