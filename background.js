/*On install*/
chrome.runtime.onInstalled.addListener(function () {
    chrome.storage.local.set({'active': false});
    chrome.storage.local.set({'labelOne': ''});
    chrome.storage.local.set({'labelTwo': ''});
    reload();
});

/*Reload settings*/
function reload() {
    chrome.storage.local.get({'active': false, 'url': '', 'labelOne': '', 'labelTwo': ''}, function (result) {
        //var data = $('#ghx-chart-data td[headers="series-event-type"]')

        if (result.active) {
            chrome.browserAction.setIcon({path: "on.png"});

        } else {
            chrome.browserAction.setIcon({path: "off.png"});
        }

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {'result': result}, function(response) {
                console.log(response.farewell);
            });
        });

    });
}
