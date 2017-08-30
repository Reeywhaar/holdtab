function listen(host, fn, ...params){
	const handler = async (...args) => {
		return await fn(args, () => {
			host.removeListener(handler);
		});
	};
	host.addListener.call(host, handler, ...params);
}

const handlers = new Map();

async function onTabEvent(id){
	if(!handlers.has(id)) return;

	await handlers.get(id)()
	handlers.delete(id);
}

browser.tabs.onActivated.addListener(info => {
	onTabEvent(info.tabId);
});

browser.tabs.onRemoved.addListener(tabId => {
	onTabEvent(tabId);
});

async function waitForActiveTab(id){
	if ((await browser.tabs.get(id)).active) return;
	await new Promise(resolve => {
		handlers.set(id, () => resolve());
	});
}

browser.tabs.onCreated.addListener(tab => {
	if (tab.active) return;
	browser.webRequest.onHeadersReceived.addListener(
		async function handler(e){
			browser.webRequest.onHeadersReceived.removeListener(handler);
			await waitForActiveTab(tab.id);
		},
		{
			urls: ["<all_urls>"],
			tabId: tab.id,
		},
		["blocking"],
	);
});