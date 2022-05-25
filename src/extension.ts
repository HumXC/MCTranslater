import path = require("path");
import * as vscode from "vscode";
import * as fs from "fs";
import { readHtml } from "./util";
import { Document, trHandleBaidu, WebviewDocument } from "./translate";

export function activate(context: vscode.ExtensionContext) {
    console.log("激活扩展");
    let disposable = vscode.commands.registerCommand("mctranslater.openFile", (uri) => {
        runCommand(context, uri);
    });

    context.subscriptions.push(disposable);
}
async function createPanel(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        "mctranslater.tr",
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

async function runCommand(context: vscode.ExtensionContext, uri: vscode.Uri) {
    console.log("正在启动翻译");
    // 加载的字符串
    var doc: Document = {
        str: "",
        obj: {},
        doctype: "unknow",
        result: [],
        path: uri.fsPath,
    };
    // 获取配置
    var conf = vscode.workspace.getConfiguration("mctranslater");
    var appid = conf.get("百度翻译_AppID") as string;
    var secretkey = conf.get("百度翻译_SecretKey") as string;
    if (appid === undefined || secretkey === undefined) {
        vscode.window.showErrorMessage("百度翻译配置不正确");
        return;
    }

    // 加载网页视图
    const panel = await createPanel(context);
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
                    vscode.window.showErrorMessage("保存失败:" + (error as Error).message);
                    return;
                }
                panel.webview.postMessage({ type: "Savesuccess" });
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
        vscode.window.showErrorMessage("读取文件时出现了错误:\n" + error);
        return;
    }

    doc.doctype = path.extname(uri.fsPath).replace(".", "");
    if (doc.doctype === "json") {
        doc.obj = JSON.parse(doc.str);
        for (const key in doc.obj) {
            if (Object.prototype.hasOwnProperty.call(doc.obj, key)) {
                doc.result.push({ name: key, src: doc.obj[key] as string, dst: "" });
            } else {
                console.log("errr");
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

    try {
        await trHandleBaidu(doc, appid, secretkey);
    } catch (error) {
        vscode.window.showErrorMessage("请求 API 时出现错误:" + (error as Error).message);
        return;
    }
    panel.webview.postMessage({ type: "Loadcomplete", data: JSON.stringify(doc) });
}

export function deactivate() {}
