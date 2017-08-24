function listen(host, fn, ...additionalParams){
	const handler = async (...args) => {
		await fn(args, () => {
			host.removeListener(handler);
		});
	};
	host.addListener.call(host, handler, ...additionalParams);
}

async function waitForActiveTab(id){
	if ((await browser.tabs.get(id)).active) return;
	await new Promise(resolve => {
		const handler = ([{tabId: uId}], unsub) => {
			if(uId === id){
				unsub();
				resolve();
			};
		};

		//fuckin event listeners, why are they must be so complicated
		listen(
			browser.tabs.onActivated,
			handler,
		);
		listen(
			browser.tabs.onRemoved,
			([rId], unsub) => {
				if(rId === id){
					browser.tabs.onActivated.removeListener(handler);
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
			try{
				await waitForActiveTab(tab.id);
			} catch (e) {
			}
			unsub();
		},
		{
			urls: ["<all_urls>"],
			tabId: tab.id,
		},
		["blocking"],
	);
});