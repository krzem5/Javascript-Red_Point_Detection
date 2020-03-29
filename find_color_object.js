 function find_color_object(img,c,MAX_GROUP_DIST=50,MIN_GROUP_ITEMS=100){
	c=c.slice()
	c.forEach((a,b,c)=>c[b]=[parseInt(a[0].substring(1,3),16),parseInt(a[0].substring(3,5),16),parseInt(a[0].substring(5,7),16),a[1],a[2]||a[1],a[3]||a[1]])
	var ctx=document.createElement("canvas").getContext("2d")
	ctx.canvas.width=img.width
	ctx.canvas.height=img.height
	ctx.drawImage(img,0,0)
	var img=ctx.getImageData(0,0,img.width,img.height)
	var groups=[]
	var x=0,y=0
	for (var i=0;i<img.data.length;i+=4){
		var s=false
		for (var cl of c){
			if (Math.abs(img.data[i]-cl[0])<=cl[3]&&Math.abs(img.data[i+1]-cl[1])<=cl[4]&&Math.abs(img.data[i+2]-cl[2])<=cl[5]){
				img.data[i]=255
				s=true
				break
			}
		}
		if (s==true){
			if (groups.length==0){
				groups.push([[i,x,y]])
			}
			else{
				var s=false
				for (var g of groups){
					for (var e of g){
						if (Math.abs(e[1]-x)+Math.abs(e[2]-y)<=MAX_GROUP_DIST){
							s=true
							break
						}
					}
					if (s==true){
						g.push([i,x,y])
						break
					}
				}
				if (s==false){
					groups.push([[i,x,y]])
				}
			}
		}
		else{
			img.data[i+3]=128
		}
		x++
		if (x==ctx.canvas.width){
			x=0
			y++
		}
	}
	var sl=[]
	for (var g of groups){
		if (g.length>MIN_GROUP_ITEMS){
			var min={x:g[0][1],y:g[0][2]},max={x:g[0][1],y:g[0][2]}
			for (var e of g){
				min.x=Math.min(min.x,e[1])
				min.y=Math.min(min.y,e[2])
				max.x=Math.max(max.x,e[1])
				max.y=Math.max(max.y,e[2])
			}
			sl.push({min:min,max:max})
		}
	}
	for (var i=sl.length-1;i>=0;i--){
		var g=sl[i]
		for (var j=sl.length-1;j>=0;j--){
			var og=sl[j]
			if (g==og){continue}
			if (g.min.x<=og.min.x&&g.min.y<=og.min.y&&g.max.x>=og.max.x&&g.max.y>=og.max.y){
				sl.splice(j,1)
			}
		}
	}
	ctx.putImageData(img,0,0)
	ctx.lineWidth=5
	ctx.strokeStyle="#00ff00"
	for (var g of sl){
		ctx.strokeRect(g.min.x,g.min.y,g.max.x-g.min.x,g.max.y-g.min.y)
	}
	return sl
}
function update_tracked_points(points,groups,MAX_SIZE_DIFF=50,MAX_GROUP_DIST=800){
	if (points.length==0){
		var i=0
		for (var g of groups){
			points.push({id:i,pos:{x:g.min.x/2+g.max.x/2,y:g.min.y/2+g.max.y/2},size:{w:g.max.x-g.min.x,h:g.max.y-g.min.y},active:true})
			i++
		}
		return points
	}
	var npl=[]
	for (var p of points){
		npl.push({id:p.id,pos:p.pos,size:p.size,active:false})
	}
	for (var g of groups){
		var pos={x:g.min.x/2+g.max.x/2,y:g.min.y/2+g.max.y/2}
		var size={w:g.max.x-g.min.x,h:g.max.y-g.min.y}
		var d=Infinity,tp=null
		for (var p of npl){
			if (p.active==true){continue}
			var nd=Math.abs(p.pos.x-pos.x)+Math.abs(p.pos.y-pos.y)
			if (nd<=MAX_GROUP_DIST&&nd<d&&Math.abs(p.size.w-size.w)<=MAX_SIZE_DIFF&&Math.abs(p.size.h-size.h)<=MAX_SIZE_DIFF){
				d=nd
				tp=p
			}
		}
		if (tp!=null){
			tp.pos=pos
			tp.size={w:g.max.x-g.min.x,h:g.max.y-g.min.y}
			tp.active=true
		}
	}
	return npl
}
function track_in_video(path,COLOR_MATCH,callback,log=false){
	var TEXT=document.createElement("div")
	document.body.appendChild(TEXT)
	var TRACK_DATA=[]
	var video=document.createElement("video")
	document.body.appendChild(video)
	// video.style="width: 0px;height: 0px"
	video.src=path
	video.autoplay=true
	video.muted="muted"
	video.onplaying=function(){
		video.onplaying=null
		var t=video.captureStream().getVideoTracks()[0]
		video.frameRate=t.getSettings().frameRate
		var imC=new ImageCapture(t)
		function cap(i=0){
			if (video.ended==true){
				document.body.removeChild(video)
				function track(i=0,lp=-1){
					if (log==true&&Math.floor(i/TRACK_DATA.length*100)!=lp){
						lp=Math.floor(i/TRACK_DATA.length*100)
						console.log(Math.floor(i/TRACK_DATA.length*100)+"% complete")
					}
					if (i==TRACK_DATA.length){
						if (log==true){console.log("Done!")}
						callback(TRACK_DATA)
						return
					}
					TRACK_DATA[i].data=update_tracked_points((TRACK_DATA[i-1]!=null?TRACK_DATA[i-1].data:[]),TRACK_DATA[i].data)
					setTimeout(track,0,i+1,lp)
				}
				if (log==true){console.log("Removing null data")}
				for (var i=TRACK_DATA.length-1;i>=0;i--){
					if (TRACK_DATA[i]==null){
						TRACK_DATA.splice(i,1)
					}
					if (i>1&&TRACK_DATA[i-1]!=null&&Math.abs(TRACK_DATA[i-1].frameTime-TRACK_DATA[i].frameTime)<1/video.frameRate/2){
						TRACK_DATA.splice(i,1)
					}
				}
				if (log==true){console.log("Parsing track data")}
				track()
				return
			}
			var j=i+0
			video.pause()
			imC.grabFrame().then(function(img){
				TRACK_DATA[j]={data:find_color_object(img,COLOR_MATCH,50,150),frameTime:video.currentTime}
				TEXT.innerHTML=video.currentTime
				video.play()
				setTimeout(cap,1/30*1000,i+1)
				console.log(j)
			}).catch(function(err){
				if (err==undefined){return}
				TEXT.innerHTML="SKIP: "+video.currentTime
				video.play()
				setTimeout(cap,1/30*1000,i+1)
			})
		}
		cap()
		if (log==true){console.log("Framing video")}
	}
}