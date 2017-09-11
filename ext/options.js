async function getData(){
	const out = await browser.storage.local.get(["mode", "domains"]);
	return Object.assign({
		mode: "disable",
		domains: [],
	}, out);
}

async function setData(data){
	await browser.storage.local.set(data);
}

const DOM = {
	select: document.querySelector(".mode-select"),
	textarea: document.querySelector(".domains-list__textarea"),
}

function onChange(cb){
	function getMode(){
		return DOM.select.options[DOM.select.selectedIndex].value
	}

	function getList(){
		return DOM.textarea.value;
	}

	function getData(){
		return {
			mode: getMode(),
			domains: getList(),
		};
	}

	DOM.select.addEventListener("change", (e)=>{
		cb(getData());
	});

	DOM.textarea.addEventListener("change", (e)=>{
		cb(getData());
	})
}

function listToDomains(list){
	if(/^\s*$/.test(list)) return [];
	return list.split(",")
	.map(x => x.trim())
	.filter(x => x !== "" || !(/^\s*$/.test(x)))
}

async function main(){
	const data = await getData();
	DOM.select.value = data.mode;
	DOM.textarea.value = data.domains.join(", ");
	onChange((data) => {
		data.domains = listToDomains(data.domains);
		setData(data);
	});
}

main().catch(e => console.error(e));