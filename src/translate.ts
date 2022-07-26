/*
 * @Author: HumXC Hum-XC@outlook.com
 * @Date: 2022-05-25
 * @LastEditors: HumXC Hum-XC@outlook.com
 * @LastEditTime: 2022-07-26
 * @FilePath: \MCTranslator\src\translate.ts
 * @Description:
 *
 * Copyright (c) 2022 by HumXC Hum-XC@outlook.com, All Rights Reserved.
 */
import {} from "./extension";
import { baidu, checkBaiduError } from "./network";
import { sleep } from "./util";

// 翻译的文档
export type Document = {
    path: string;
    str: string;
    obj: JSON | any;
    doctype: "json" | string;
    // [{翻译的名称,待翻译的原文，翻译结果}]
    result: Array<{ name: string; src: string; dst: string }>;
};
// 由 webview 返回的文档
export type WebviewDocument = {
    path: string;
    str: string;
    obj: JSON | any;
    doctype: "json" | string;
    // [{翻译的名称,待翻译的原文，翻译结果}]
    result: Array<{ name: string; dst: string }>;
};

export async function trHandleBaidu(
    doc: Document,
    source: string,
    target: string,
    appid: string,
    secretkey: string,
    isAdvancedVersion: boolean = false
) {
    let qos = 1;
    let maxLength = 1000;
    let queryStrList: string[] = [];
    if (isAdvancedVersion) {
        qos = 10;
        maxLength = 6000;
    }
    for (let i = 0; i < doc.result.length; i++) {
        queryStrList.push(fomartQueryStr(doc.result[i].src));
    }
    let queryStr = "";
    let index = 0;
    for (let i = 0; i < queryStrList.length; i++) {
        let s = queryStr + queryStrList[i] + "\n";
        let tr = async () => {
            let result = await baidu(queryStr, source, target, appid, secretkey);

            let err = checkBaiduError(result);
            if (err !== undefined) {
                throw new Error(err);
            }

            for (let j = 0; j < result.trans_result.length; j++) {
                let r = result.trans_result[j];
                if (fomartQueryStr(doc.result[j + index].src) === r.src) {
                    doc.result[j + index].dst = deFomartQueryStr(r.dst);
                }
            }

            index = i;
            queryStr = "";
            await sleep(Math.ceil(1000 / qos));
        };

        if (s.length >= maxLength) {
            await tr();
            --i;
            continue;
        } else {
            queryStr = s;
        }
        if (i === queryStrList.length - 1) {
            await tr();
        }
    }
}
function fomartQueryStr(str: string): string {
    if (str === "") {
        return "[%0]";
    }
    // 去除可能会影响签名的字符,转换成自定义的编码
    return str
        .replace(/\n/g, "[%1]")
        .replace(/\\/g, "[%2]")
        .replace(/\&/g, "[%3]")
        .replace(/\+/g, "[%4]")
        .replace(/\§/g, "[%5]")
        .replace(/\#/g, "[%6]")
        .replace(/\_/g, "[%7]");
}
function deFomartQueryStr(str: string): string {
    if (str === "[%0]") {
        return "";
    }
    return str
        .replace(/\[%1\]/g, "\n")
        .replace(/\[%2\]/g, "\\")
        .replace(/\[%3\]/g, "&")
        .replace(/\[%4\]/g, "+")
        .replace(/\[%5\]/g, "§")
        .replace(/\[%6\]/g, "#")
        .replace(/\[%7\]/g, "_");
}
