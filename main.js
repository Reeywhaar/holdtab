function listen(host, fn, ...params){
	const handler = async (...args) => {
		await fn(args, () => {
			host.removeListener(handler);
		});
	};
	host.addListener.call(host, handler, ...params);
}

const handlers = new Map();

browser.tabs.onActivated.addListener(async info => {
	if(!handlers.has(info.tabId)) return;

	await handlers.get(info.tabId)(
		info,
		()=>{
			handlers.delete(info.tabId);
		},
	);
});

browser.tabs.onRemoved.addListener(tabId => {
	if(handlers.has(tabId)){
		console.log("has", tabId);
	};
	handlers.delete(tabId);
});

async function waitForActiveTab(id){
	if ((await browser.tabs.get(id)).active) return;
	await new Promise(resolve => {
		handlers.set(
			id,
			({tabId: uId}, unsub) => {
				if(uId === id){
					unsub();
					resolve();
				};
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