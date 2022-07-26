/*
 * @Author: HumXC Hum-XC@outlook.com
 * @Date: 2022-05-25
 * @LastEditors: HumXC Hum-XC@outlook.com
 * @LastEditTime: 2022-07-26
 * @FilePath: \MCTranslator\src\util.ts
 * @Description:
 *
 * Copyright (c) 2022 by HumXC Hum-XC@outlook.com, All Rights Reserved.
 */
import vscode = require("vscode");
import path = require("path");
const { readFile } = require("fs").promises;

export const readHtml = async (htmlPath: string, panel: vscode.WebviewPanel) =>
    (await readFile(htmlPath, "utf-8"))
        .replace(/%CSP_SOURCE%/gu, panel.webview.cspSource)
        .replace(
            /(src|href)="([^"]*)"/gu,
            (_: any, type: any, src: string) =>
                `${type}="${panel.webview.asWebviewUri(
                    vscode.Uri.file(path.resolve(htmlPath, "..", src))
                )}"`
        );
export function sleep(timeout: number): Promise<void> {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, timeout);
    });
}
