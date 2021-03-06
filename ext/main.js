(async () => {
	function oneOf(subj, ...objs){
		for(let obj of objs){
			if(subj === obj) return true;
		}
		return false;
	}

	const state = {
		processed: new Set(),
		isWebRegex: /^https?:/i,
		browserInfo: await browser.runtime.getBrowserInfo(),
	}

	state.browserInfo.versionMajor = parseInt(/^(\d+)\./.exec(state.browserInfo.version)[1], 10);

	//thank you: https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
	function escapeRegExp(str) {
		return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
	}

	function parseQuery(url){
		url = new URL(url);
		return url.search
		.substr(1)
		.split("&")
		.map(x => {
			return x
			.split("=")
			.map(x => decodeURIComponent(x));
		})
		.reduce((c, x) => {
			c[x[0]] = x[1];
			return c;
		}, {});
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

	function isHandlerUrl(url){
		return url.indexOf(browser.extension.getURL("handler.html")) === 0;
	}

	function isHoldable(url){
		if(!state.isWebRegex.test(url)) return false;
		url = new URL(url);
		if(data.mode === "enable"){
			return data.regex.test(url.host);
		} else {
			return !data.regex.test(url.host);
		}
	}

	browser.tabs.onActivated.addListener(async ({tabId, windowId}) => {
		const tabUrl = (await browser.tabs.get(tabId)).url;
		if(!isHandlerUrl(tabUrl)) return;
		browser.history.deleteUrl({
			url: tabUrl,
		});
		const url = parseQuery(tabUrl).url;
		browser.webRequest.onBeforeSendHeaders.addListener(
			async function handler(e){
				if(!isHandlerUrl(e.originUrl)) {
					browser.webRequest.onBeforeSendHeaders.removeListener(handler);
					return;
				};
				const requestData = parseQuery(e.originUrl);
				requestData.headers = JSON.parse(requestData.headers);
				browser.webRequest.onBeforeSendHeaders.removeListener(handler);
				e.requestHeaders = requestData.headers;
				return {requestHeaders: e.requestHeaders};
			},
			{
				urls: ["<all_urls>"],
				tabId: tabId,
			},
			["blocking", "requestHeaders"],
		);
		if(state.browserInfo.versionMajor >= 57){
			browser.tabs.update(tabId, {
				url,
				loadReplace: true,
			});
		}
	})

	browser.tabs.onUpdated.addListener((id, info) => {
		if(state.processed.has(id)) return;
		if("url" in info && !isHoldable(info.url)){
			state.processed.add(id);
		}
	});

	browser.tabs.onCreated.addListener(tab => {
		browser.webRequest.onBeforeSendHeaders.addListener(
			async function handler(e){
				if((await browser.tabs.get(tab.id)).active || state.processed.has(tab.id)){
					browser.webRequest.onBeforeSendHeaders.removeListener(handler);
					return;
				}
				state.processed.add(tab.id);
				if(e.type === "main_frame" && isHoldable(e.url)){
					const nogo = state.browserInfo.versionMajor >= 57 ? "&nogo=true" : "";
					const handlerURL = browser.extension.getURL(`handler.html?url=${encodeURIComponent(e.url)}&headers=${encodeURIComponent(JSON.stringify(e.requestHeaders))}${nogo}`);
					browser.webRequest.onBeforeSendHeaders.removeListener(handler);
					// well, instead of line below I need a hack, because of security error in ff55
					// return {redirectUrl: handlerURL}
					await browser.tabs.update(tab.id, {url: handlerURL});
					return {cancel: true};
				}
			},
			{
				urls: ["<all_urls>"],
				tabId: tab.id,
			},
			["blocking", "requestHeaders"],
		);
	});

	browser.tabs.onRemoved.addListener(id => {
		state.processed.delete(id);
	});
})()