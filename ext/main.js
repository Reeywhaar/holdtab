(async () => {
	function oneOf(subj, ...objs){
		for(let obj of objs){
			if(subj === obj) return true;
		}
		return false;
	}

	//thank you: https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
	function escapeRegExp(str) {
		return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
	}

	async function getData(){
		let out = await browser.storage.local.get(["mode", "domains"]);
		out = Object.assign({
			mode: "disable",
			domains: [],
		}, out);
		if(out.domains.length === 0){
			out.regex = /!.*/i;
		} else {
			out.regex = new RegExp("("+out.domains.map(x => escapeRegExp(x)).join("|")+")$", "i");
		}
		return out;
	}

	let data = await getData();
	browser.storage.onChanged.addListener(async e => {
		data = await getData();
	});

	function isHoldable(url){
		url = new URL(url);
		if(data.mode === "enable"){
			return data.regex.test(url.host);
		} else {
			return !data.regex.test(url.host);
		}
	}

	const handlers = new Map();

	async function onTabEvent(id){
		if(!handlers.has(id)) return;

		handlers.get(id)()
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
				for(let header of e.responseHeaders){
					if(header.name.toLowerCase() === "location") return;
				}
				browser.webRequest.onHeadersReceived.removeListener(handler);
				if(isHoldable(e.url)){
					await waitForActiveTab(tab.id);
				}
			},
			{
				urls: ["<all_urls>"],
				tabId: tab.id,
			},
			["blocking", "responseHeaders"],
		);
	});
})()