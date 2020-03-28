function init(){
	track_in_video("./data/v.mov",[["#ff5854",25],["#e2363b",30],["#b22324",30],["#80211a",10]],function(data){
		window.data=data
		download(data)
	},true)
}
function download(json){
	json.forEach((a,b,c)=>{
		c[b]={data:a.data,frameTime:a.frameTime}
	})
	console.log(json)
	var a=document.createElement("a")
	a.href="data:text/json;charset=uft-8,"+encodeURIComponent(JSON.stringify(json,null,4).replace(/    /g,"\t"))
	a.download="tracking-data.json"
	a.click()
}
document.addEventListener("DOMContentLoaded",init,false)