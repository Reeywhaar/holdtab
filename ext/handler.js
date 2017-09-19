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
		window.location.replace(data.url);
	});
}

main();