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

function sleep(n){
	return new Promise(resolve => {
		setTimeout(resolve, n);
	});
};

function main(){
	const data = parseQuery(window.location);
	if(!("url" in data)) return;
	document.title = data.url;
	window.addEventListener("focus", async (e) => {
		//nogo is "no go". Used in firefox 57+
		//to delay location replace below, so
		//main.js browser.tabs.update will be
		//first as it more favorable
		if("nogo" in data){
			await sleep(1000);
		}
		window.location.replace(data.url);
	});
}

main();