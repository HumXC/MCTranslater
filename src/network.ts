import * as https from "https";
import * as crypto from "crypto";
var baiduError = new Map<number, string>([
    [52000, "成功"],
    [52001, "请求超时，请重试"],
    [52002, "系统错误，请重试"],
    [52003, "未授权用户，请检查appid是否正确或者服务是否开通"],
    [54000, "必填参数为空，请检查是否少传参数"],
    [54001, "签名错误，请检查您的签名生成方法"],
    [54003, "访问频率受限，请降低您的调用频率，或进行身份认证后切换为高级版/尊享版"],
    [54004, "账户余额不足，请前往管理控制台为账户充值"],
    [54005, "长query请求频繁，请降低长query的发送频率，3s后再试"],
    [58000, "客户端IP非法，检查个人资料里填写的IP地址是否正确，可前往开发者信息-基本信息修改 "],
    [58001, "译文语言方向不支持，检查译文语言是否在语言列表里"],
    [58002, "服务当前已关闭，请前往管理控制台开启服务"],
    [90107, "认证未通过或未生效，请前往我的认证查看认证进度"],
]);

// 百度翻译请求参数
export type BaiduReq = {
    // 请求翻译query
    q: string;
    // 翻译源语言
    from: string;
    // 翻译目标语言
    to: string;
    // APPID
    appid: string;
    // 随机数
    salt: string;
    // 签名
    sign: string;
};
// 百度翻译回复参数
export type BaiduResp = {
    from: string;
    to: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    trans_result: Array<{ src: string; dst: string }>;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    error_code: string;
};
/** 发送http请求 */
function doHttp(options: https.RequestOptions, data: any = undefined): any {
    let a = "";
    return new Promise((resolve, reject) => {
        var respData: string = "";
        const req = https.request(options, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(res.statusCode?.toString()));
            }
            res.on("data", (d: Buffer) => {
                respData += d.toString("utf-8");
            });
        });
        req.once("error", (error) => {
            reject(error);
        });
        req.once("close", () => {
            try {
                let jsonData = JSON.parse(respData);
                resolve(jsonData);
            } catch (error) {
                reject(error);
            }
        });
        if (data !== undefined) {
            req.write(data);
        }
        req.end();
    });
}
export function baidu(
    str: string,
    from: string,
    to: string,
    appid: string,
    key: string
): Promise<BaiduResp> {
    let salt = Math.ceil(Math.random() * 100000).toString();
    let sign = md5(appid + str + salt + key);
    let data: BaiduReq = {
        q: encodeURI(str),
        from: from,
        to: to,
        appid: appid,
        salt: salt,
        sign: sign,
    };
    let query: string = objToQuery(data);
    let options: https.RequestOptions = {
        hostname: `fanyi-api.baidu.com`,
        path: `/api/trans/vip/translate?` + query,
        method: "GET",
        timeout: 10000,
    };
    return doHttp(options);
}
function md5(str: string): string {
    return crypto.createHash("md5").update(str).digest("hex");
}
// 解析百度api的错误
export function checkBaiduError(resp: BaiduResp): string | undefined {
    let code = Number.parseInt(resp.error_code);
    if (code === 52000) {
        return undefined;
    }
    return baiduError.get(code);
}

// 对象转 GET 使用的 QueryString
function objToQuery(obj: any): string {
    let result = "&";
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            result += `&${key}=${obj[key]}`;
        }
    }
    // 返回时去除开头的 &&
    return result.replace("&&", "");
}
