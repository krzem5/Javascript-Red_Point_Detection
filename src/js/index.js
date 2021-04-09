var imC=null,cnv,ctx,POINTS=[]
var COLOR_MATCH=[["#a10008",25],["#720008",30]]
var cam_constraints={audio:false,video:{width:{ideal:1280,max:1280},height:{ideal:720,max:720},frameRate:{ideal:60,max:60},deviceId:null}}
var CAM_ID=0
function init(){
	cnv=document.querySelector("canvas._3")
	ctx=cnv.getContext("2d")
	navigator.mediaDevices.enumerateDevices().then(function(r){
		var cl=[]
		r.forEach((a)=>{
			if (a.label.toLowerCase().includes("camera")){cl.push(a)}
		})
		cam_constraints.video.deviceId=cl[CAM_ID].deviceId
		navigator.mediaDevices.getUserMedia(cam_constraints).then(function(stream){
			var video=document.querySelector("video._1")
			video.srcObject=stream
			video.onloadedmetadata=function(e){
				video.play()
			}
			var t=stream.getVideoTracks()[0]
			imC=new ImageCapture(t)
			cap()
		}).catch(function(err){
			console.log(err.name+": "+err.message)
		})
	})
}
function cap(){
	imC.grabFrame().then(function(img){
		draw(img)
	}).catch(function(err){
		console.log("Frame Error: "+err)
	})
}
function draw(img,draw_function){
	ctx.clearRect(0,0,cnv.width,cnv.height)
	cnv.width=img.width
	cnv.height=img.height
	ctx.drawImage(img,0,0)
	var groups=find_color_object(img,COLOR_MATCH,100,150)/*#90001d,#f65c58*/
	POINTS=update_tracked_points(POINTS,groups)
	for (var p of POINTS){
		switch (p.id){
			case 0:
				ctx.strokeStyle="#00ff00"
				break
			case 1:
				ctx.strokeStyle="#0000ff"
				break
			case 2:
				ctx.strokeStyle="#00ffff"
				break
			case 3:
				ctx.strokeStyle="#ff00ff"
				break
		}
		ctx.lineWidth=5
		ctx.strokeRect(p.pos.x-p.size.w/2,p.pos.y-p.size.h/2,p.size.w,p.size.h)
	}
	setTimeout(cap,0)
}
document.addEventListener("DOMContentLoaded",init,false)
