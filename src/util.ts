import vscode = require("vscode");
import path = require("path");
const { readFile, writeFile } = require("fs").promises;

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
