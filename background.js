var requestListener = function (details) {
    var flag = false,
        rule = {
            name: "Origin",
            value: "http://evil.com/"
        };
    var i;

    for (i = 0; i < details.requestHeaders.length; ++i) {
        if (details.requestHeaders[i].name.toLowerCase() === rule.name.toLowerCase()) {
            flag = true;
            details.requestHeaders[i].value = rule.value;
            break;
        }
    }
    if (!flag) details.requestHeaders.push(rule);

    for (i = 0; i < details.requestHeaders.length; ++i) {
        if (details.requestHeaders[i].name.toLowerCase() === "access-control-request-headers") {
            accessControlRequestHeaders = details.requestHeaders[i].value
        }
    }

    return {requestHeaders: details.requestHeaders};
};

var responseListener = function (details) {
    var flag = false,
        rule = {
            "name": "Access-Control-Allow-Origin",
            "value": "*"
        };

    for (var i = 0; i < details.responseHeaders.length; ++i) {
        if (details.responseHeaders[i].name.toLowerCase() === rule.name.toLowerCase()) {
            flag = true;
            details.responseHeaders[i].value = rule.value;
            break;
        }
    }
    if (!flag) details.responseHeaders.push(rule);

    if (accessControlRequestHeaders) {

        details.responseHeaders.push({"name": "Access-Control-Allow-Headers", "value": accessControlRequestHeaders});

    }

    if (exposedHeaders) {
        details.responseHeaders.push({"name": "Access-Control-Expose-Headers", "value": exposedHeaders});
    }

    details.responseHeaders.push({
        "name": "Access-Control-Allow-Methods",
        "value": "GET, PUT, POST, DELETE, HEAD, OPTIONS"
    });

    return {responseHeaders: details.responseHeaders};

};

/*On install*/
chrome.runtime.onInstalled.addListener(function () {
    chrome.storage.local.set({'active': false});
    chrome.storage.local.set({'labelOne': ''});
    chrome.storage.local.set({'labelTwo': ''});
    reload();
});

/*Reload settings*/
function reload() {
    chrome.storage.local.get({'active': false, 'labelOne': '', 'labelTwo': ''}, function (result) {
        //var data = $('#ghx-chart-data td[headers="series-event-type"]')

        if (result.active) {
            chrome.browserAction.setIcon({path: "on.png"});

        } else {
            chrome.browserAction.setIcon({path: "off.png"});
        }
    });
}
