var update_ui = function(is_active) {
    if (is_active) {
        chrome.browserAction.setBadgeText({text: 'on'});
        chrome.browserAction.setBadgeBackgroundColor({color: 'black'});
    } else {
        chrome.browserAction.setBadgeText({text: ''});
    }
}

chrome.runtime.onInstalled.addListener(function(details) {
    console.log('monochrome-web installed or updated');

    chrome.storage.local.get(['is_active'], function(result) {
        update_ui(result.is_active);
    });
});

chrome.browserAction.onClicked.addListener(function(tab) {
    console.log('monochrome-web toggle clicked');

    chrome.storage.local.get(['is_active'], function(result) {
        var new_is_active = !result.is_active;

        update_ui(new_is_active);

        chrome.storage.local.set({'is_active': new_is_active}, function() {
            console.log('monochrome-web is turned ' + (new_is_active ? 'on' : 'off'));
        });
    });
});
