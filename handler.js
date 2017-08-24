function getURL(){
	return decodeURIComponent(window.location.search.substr(5));
}
document.title = getURL();
window.addEventListener("focus", ()=>{
	location.replace(getURL());
})