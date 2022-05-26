import path = require("path");
import * as vscode from "vscode";
import * as fs from "fs";
import { readHtml } from "./util";
import { Document, trHandleBaidu, WebviewDocument } from "./translate";
var outputChannel: vscode.OutputChannel;
export function activate(context: vscode.ExtensionContext) {
    if (outputChannel === undefined) {
        outputChannel = vscode.window.createOutputChannel("MCTranslator");
    }
    output("激活扩展");
    let disposable = vscode.commands.registerCommand("mctranslator.openFile", (uri) => {
        createPanel(context).then((panel: vscode.WebviewPanel) => {
            runCommand(context, panel, uri);
        });
    });

    context.subscriptions.push(disposable);
}
async function createPanel(context: vscode.ExtensionContext): Promise<vscode.WebviewPanel> {
    const panel = vscode.window.createWebviewPanel(
        "mctranslator.tr",
        "翻译工作台",
        { viewColumn: vscode.ViewColumn.Active, preserveFocus: true },
        {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(context.extensionPath)],
            retainContextWhenHidden: true,
        }
    );
    panel.webview.html = await readHtml(
        path.resolve(context.extensionPath, "webview/index.html"),
        panel
    );

    return panel;
}

async function runCommand(
    context: vscode.ExtensionContext,
    panel: vscode.WebviewPanel,
    uri: vscode.Uri
) {
    output("正在启动翻译");
    // 加载的字符串
    var doc: Document = {
        str: "",
        obj: {},
        doctype: "unknow",
        result: [],
        path: uri.fsPath,
    };
    // 获取配置
    var conf = vscode.workspace.getConfiguration("mctranslator");
    var appid = conf.get("百度翻译_AppID") as string;
    var secretkey = conf.get("百度翻译_SecretKey") as string;
    var autoTrslante = conf.get("自动翻译") as boolean;
    if (appid === undefined || secretkey === undefined) {
        showError("百度翻译配置不正确");
        return;
    }

    // 设置页面
    panel.webview.onDidReceiveMessage(async ({ type, data }) => {
        switch (type) {
            case "save":
                try {
                    let doc: WebviewDocument = JSON.parse(data);
                    let fileName = path.join(
                        path.dirname(doc.path),
                        "tr_" + path.basename(doc.path)
                    );
                    if (doc.doctype === "json") {
                        for (let i = 0; i < doc.result.length; i++) {
                            if (Object.prototype.hasOwnProperty.call(doc.obj, doc.result[i].name)) {
                                doc.obj[doc.result[i].name] = doc.result[i].dst;
                            }
                        }

                        fs.writeFileSync(
                            fileName,
                            JSON.stringify(doc.obj).replace(/","/g, '",\n"')
                        );
                    } else {
                        for (let i = 0; i < doc.result.length; i++) {
                            doc.str = doc.str.replace(
                                new RegExp(`(?<=${doc.result[i].name}\\=).+`, "g"),
                                doc.result[i].dst
                            );
                        }
                        fs.writeFileSync(fileName, doc.str);
                    }
                } catch (error) {
                    panel.webview.postMessage({ type: "SaveFail" });
                    showError("保存失败", error);
                    return;
                }
                panel.webview.postMessage({ type: "Savesuccess" });
                break;

            case "Translate":
                try {
                    let setting = JSON.parse(data);
                    output(
                        `开始翻译(webview): path=${doc.path}\n lang:${setting[0]}->${setting[1]}\n appid=${appid}\n secretkey=${secretkey}`
                    );
                    await trHandleBaidu(doc, setting[0], setting[1], appid, secretkey);
                } catch (error) {
                    panel.webview.postMessage({ type: "TrslateFail" });
                    showError("请求 API 时出现错误", error);
                    return;
                }
                panel.webview.postMessage({ type: "Loadcomplete", data: JSON.stringify(doc) });
                break;
            case "warn":
                vscode.window.showWarningMessage(data);
                break;
        }
    });
    // 读取文件
    try {
        let d = fs.readFileSync(doc.path);
        doc.str = d.toString("utf-8");
    } catch (error) {
        showError("读取文件时出现了错误", error);
        return;
    }

    doc.doctype = path.extname(uri.fsPath).replace(".", "");
    if (doc.doctype === "json") {
        try {
            doc.obj = JSON.parse(doc.str);
        } catch (error) {
            showError("解析 Json 时出现了错误", error);
        }

        for (const key in doc.obj) {
            if (Object.prototype.hasOwnProperty.call(doc.obj, key)) {
                doc.result.push({ name: key, src: doc.obj[key] as string, dst: "" });
            }
        }
    } else {
        let strArr = doc.str.split("\n");
        for (let i = 0; i < strArr.length; i++) {
            let sp = strArr[i].split("=");
            if (sp[0] === undefined || sp[1] === undefined) {
                continue;
            }
            doc.result.push({ name: sp[0], src: sp[1], dst: "" });
        }
    }
    // 开始自动翻译
    if (autoTrslante) {
        output(
            `开始自动翻译: path=${doc.path}\n lang:auto->zh\n appid=${appid}\n secretkey=${secretkey}`
        );
        try {
            await trHandleBaidu(doc, "auto", "zh", appid, secretkey);
        } catch (error) {
            showError("请求 API 时出现错误", error);
            return;
        }
    }

    panel.webview.postMessage({ type: "Loadcomplete", data: JSON.stringify(doc) });
}

export function deactivate() {
    output("停止活动");
}
function showError(msg: string, error: any = undefined) {
    let windowMmessage = "";
    let channelMessage = "";
    if (error === undefined || error.message === undefined) {
        windowMmessage = msg;
        channelMessage = msg;
    } else {
        windowMmessage = msg + ": " + (error as Error).message;
        channelMessage = msg + ": \n" + (error as Error).message + "\n" + (error as Error).stack;
    }
    output(channelMessage);
    vscode.window.showErrorMessage(windowMmessage);
}

// 输出到容器
function output(msg: string) {
    outputChannel.appendLine(msg);
}
