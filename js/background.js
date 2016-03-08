chrome.extension.onConnect.addListener(function(port) {
  // This will get called by the content script we execute in
  // the tab as a result of the user pressing the browser action.
  port.onMessage.addListener(function(info) {
   var max_length = 1024;
   if (info.selection.length > max_length)
    info.selection = info.selection.substring(0, max_length);
    openOrFocusOptionsPage();
  });
});

// Called when the user clicks on the browser action icon.
chrome.browserAction.onClicked.addListener(function(tab) {
  var tasksURL = chrome.extension.getURL('src/tasks.html'); 
  chrome.tabs.query({}, function(extensionTabs) {
    for (var i=0; i < extensionTabs.length; i++) {
      if (extensionTabs[i].url == tasksURL) {
        chrome.tabs.update(extensionTabs[i].id, {"selected": true});
        return;
      }
    }
    chrome.tabs.create({url: "src/tasks.html"});
  });
});