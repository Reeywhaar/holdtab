function listen(host, fn, ...params){
	const handler = async (...args) => {
		return await fn(args, () => {
			host.removeListener(handler);
		});
	};
	host.addListener.call(host, handler, ...params);
}

const handlers = new Map();

browser.tabs.onActivated.addListener(async info => {
	if(!handlers.has(info.tabId)) return;

	if(await handlers.get(info.tabId)(info.tabId)){
		handlers.delete(info.tabId);
	};
});

browser.tabs.onRemoved.addListener(async tabId => {
	if(!handlers.has(tabId)) return;

	if(await handlers.get(tabId)(tabId)){
		handlers.delete(tabId);
	};
});

async function waitForActiveTab(id){
	if ((await browser.tabs.get(id)).active) return;
	await new Promise(resolve => {
		handlers.set(
			id,
			(uId) => {
				if(uId === id){
					resolve();
					return true;
				};
				return false;
			},
		);
	});
}

browser.tabs.onCreated.addListener(tab => {
	if (tab.active) return;
	listen(
		browser.webRequest.onHeadersReceived,
		async ([e], unsub)=>{
			unsub();
			try{
				await waitForActiveTab(tab.id);
			} catch (e) {}
		},
		{
			urls: ["<all_urls>"],
			tabId: tab.id,
		},
		["blocking"],
	);
});