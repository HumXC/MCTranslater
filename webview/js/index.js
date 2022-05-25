const vscode = acquireVsCodeApi();
window.onload = function () {};
var doc;
window.addEventListener("message", (event) => {
    let message = event.data;
    let data = JSON.parse(message.data);
    switch (message.type) {
        case "Loadcomplete":
            doc = data;
            addItem(data.result);
            break;
    }
});
function save() {
    let items = document.getElementsByClassName("item");
    doc.result = [];

    for (let i = 0; i < items.length; i++) {
        if (!items[i].childNodes[3].checked) {
            continue;
        }
        let _name = items[i].childNodes[5].childNodes[3].title;
        let _src = items[i].childNodes[5].childNodes[1].textContent;
        let _dst = items[i].childNodes[5].childNodes[3].value;
        doc.result.push({ name: _name, src: _src, dst: _dst });
    }
    if (doc.result.length === 0) {
        vscode.postMessage({ type: "warn", data: "您尚未选择任何内容" });
        return;
    }

    vscode.postMessage({ type: "save", data: JSON.stringify(doc) });

    $("savebutton").disabled = true;
    setTimeout(() => {
        $("savebutton").disabled = false;
    }, 3000);
}
function selectAll() {
    var value = document.getElementById("checkall").checked;
    var items = document.getElementsByClassName("item");
    for (let i = 0; i < items.length; i++) {
        items[i].childNodes[3].checked = value;
    }
}
function addItem(items) {
    //items = [{ name: "a", src: "AA", dst: "BBB" }];
    let parent = document.getElementById("workbench");
    for (let i = 0; i < items.length; i++) {
        let item = `<div class="item">
        <label for="${i}">${i}</label>
        <input type="checkbox" id="${i}" />
        <div class="editor">
            <label for="e${i}" class="inputbox" >${lightColor(items[i].src)}</label>
            <input type="text" id="e${i}" class="inputbox" value="${items[i].dst}" title="${
            items[i].name
        }"/>
        </div>
    </div>`;
        var div = document.createElement("div");
        div.innerHTML = item;
        parent.appendChild(div);
    }
}
$ = (id) => {
    return document.getElementById(id);
};

// 给特定字符加上颜色
function lightColor(str) {
    return str
        .replace(/\\/g, "<span style='color: red;'>$&</span>")
        .replace(/\{/g, "<span style='color: red;'>$&</span>")
        .replace(/\}/g, "<span style='color: red;'>$&</span>")
        .replace(/\&/g, "<span style='color: red;'>$&</span>")
        .replace(/\§/g, "<span style='color: red;'>$&</span>");
}
