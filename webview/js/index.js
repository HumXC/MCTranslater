const vscode = acquireVsCodeApi();
var selectCount;
var checkAll;
var log;
var items;
var doc;
var intervals = [];
window.addEventListener("message", (event) => {
    for (let i = 0; i < intervals.length; i++) {
        clearInterval(intervals[i]);
    }
    let message = event.data;

    let data;
    try {
        data = JSON.parse(message.data);
    } catch (error) {
        vscode.postMessage({ type: "warn", data: error });
    }

    switch (message.type) {
        case "Loadcomplete":
            doc = data;
            addItem(data.result);
            break;
        case "Savesuccess":
            log.innerText = "保存成功👍";
            break;
        case "SaveFail":
            log.innerText = "保存失败😫";
            break;
        default:
            break;
    }
});
function test() {
    let data = [];
    for (let i = 0; i < 20; i++) {
        data.push({
            name: "a",
            src: "AAsssssssssssssssssssssssssssssssssssssssssssssss",
            dst: "BBBsssssssssssssssssssssssssssssssssss",
        });
    }
    addItem(data);
}
function save(button) {
    doc.result = [];
    for (let i = 0; i < items.length; i++) {
        if (!items[i].childNodes[3].checked) {
            continue;
        }
        let _name = items[i].childNodes[5].childNodes[3].title;
        let _dst = items[i].childNodes[5].childNodes[3].value;
        doc.result.push({ name: _name, dst: _dst });
    }
    if (doc.result.length === 0) {
        log.innerText = "⚠️您尚未选择任何内容";
        return;
    }
    log.innerText = "正在保存";
    button.disabled = true;
    setTimeout(() => {
        button.disabled = false;
    }, 3000);
    intervals.push(
        setInterval(() => {
            log.innerText += ".";
        }, 100)
    );
    vscode.postMessage({ type: "save", data: JSON.stringify(doc) });
}
function selectAll(checkAll) {
    if (checkAll.checked) {
        selectCount = items.length;
    } else {
        selectCount = 0;
    }
    log.innerText = `${selectCount} / ${items.length}`;
    for (let i = 0; i < items.length; i++) {
        items[i].childNodes[3].checked = checkAll.checked;
    }
    checkAll.className = "checkbox";
}
function addItem(_items) {
    //items = [{ name: "a", src: "AA", dst: "BBB" }];
    let parent = document.getElementById("workbench");
    for (let i = 0; i < _items.length; i++) {
        let item = `
        <label class="hide" for=${i + 1}>item</label>
        <input type="checkbox" id="${
            i + 1
        }" class="checkbox item-checkbox" onClick="itemCheckedChange(this)"/>
        
        <div class="editor">
            <label for="e${i + 1}" class="inputlabel" >${lightColor(_items[i].src)}</label>
            <input type="text" id="e${i + 1}" class="inputbox" value="${_items[i].dst}" title="${
            _items[i].name
        }"/>
    </div>`;
        var div = document.createElement("div");
        div.className = "item";
        div.innerHTML = item;
        parent.appendChild(div);
    }
    items = document.getElementsByClassName("item");
    log = document.getElementById("log");
    checkAll = document.getElementById("checkall");
    selectCount = 0;
    log.innerText = `${selectCount} / ${items.length}`;
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

// 选择按钮状态改变
function itemCheckedChange(checkbox) {
    if (checkbox.checked) {
        ++selectCount;
    } else {
        --selectCount;
    }
    log.innerText = `${selectCount} / ${items.length}`;
    if (selectCount === 0) {
        checkAll.checked = false;
        checkAll.className = "checkbox";
        return;
    }
    // 全选
    if (selectCount === items.length) {
        checkAll.className = "checkbox";
        checkAll.checked = true;
        return;
    }
    // 不全选
    checkAll.checked = false;
    checkAll.className = "checkbox notcheckall";
    return;
}
