function getURL(){
	return decodeURIComponent(window.location.search.substr(5));
}

function main(){
	document.title = getURL();
	if(document.hasFocus()){
		location.replace(getURL());
		return;
	};
	window.addEventListener("focus", ()=>{
		location.replace(getURL());
	});
}

main();