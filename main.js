function once(host, fn, ...additionalParams){
	const handler = async (...args) => {
		host.removeListener(handler);
		await fn(...args);
	}
	host.addListener.call(host, handler, ...additionalParams);
}

browser.tabs.onCreated.addListener(tab => {
	once(
		browser.webRequest.onHeadersReceived,
		async (e)=>{
			if(tab.active) return;
			await new Promise(resolve => {
				once(browser.tabs.onActivated, info => {
					if(info.tabId === tab.id && info.windowId === tab.windowId) resolve();
				});
				once(browser.tabs.onRemoved, (tabId, {windowId}) => {
					const isCurrentTab = tabId === tab.id && windowId === tab.windowId;
					if(isCurrentTab && browser.tabs.onActivated.hasListener(handler)){
						browser.tabs.onActivated.removeListener(handler);
					};
				});
			});
		},
		{
			urls: ["<all_urls>"],
			tabId: tab.id,
		},
		["blocking"],
	);
});