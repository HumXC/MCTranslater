import {} from "./extension";
import { baidu, checkBaiduError } from "./network";

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
export async function trHandleBaidu(doc: Document, appid: string, secretkey: string) {
    let queryStr = "";
    for (let i = 0; i < doc.result.length; i++) {
        queryStr += fomartQueryStr(doc.result[i].src) + "\n";
    }
    let result = await baidu(queryStr, "en", "zh", appid, secretkey);

    let err = checkBaiduError(result);
    if (err !== undefined) {
        throw new Error(err);
    }

    for (let i = 0; i < result.trans_result.length; i++) {
        let r = result.trans_result[i];

        if (fomartQueryStr(doc.result[i].src) === r.src) {
            doc.result[i].dst = deFomartQueryStr(r.dst);
        }
    }
}
function fomartQueryStr(str: string): string {
    // 去除会影响签名的字符,转换成url编码
    return str
        .replace(/\n/g, "[%0A]")
        .replace(/\\/g, "[%5C]")
        .replace(/\&/g, "[%26]")
        .replace(/\+/g, "[%2B]");
}
function deFomartQueryStr(str: string): string {
    return str
        .replace(/\[\%0A\]/g, "\n")
        .replace(/\[\%5C\]/g, "\\")
        .replace(/\[\%26\]/g, "&")
        .replace(/\[\%2B\]/g, "+");
}
