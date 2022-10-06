//Elements
const cp = document.querySelector('#ControlPanel');
const gf = document.querySelector('#GameField');
const pc = document.querySelector('#playercount');
const tcp = document.querySelector('#treasure-per-player');
const start = document.querySelector('#start');
const howto = document.querySelector('#howto');
const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');
const canvas2 = document.querySelector('#canvas2')
const ctx2 = canvas2.getContext('2d')
const desc = document.querySelector('#desc')
const colors = document.querySelector('#colors')

const save = document.querySelector('#save')
const restart = document.querySelector('#restart')
const load = document.querySelector('#load')
const load2 = document.querySelector('#load2')
const winner = document.querySelector('#winner')
save.style.left='220px'
load.style.left='280px'
load.style.opacity='20%'
if(localStorage.getItem('game')){
    load.style.opacity='100%'
    load2.style.opacity='100%'
}

const scoreboard = document.querySelector('#scoreboard')

//Game variables
let selectX=0
let selectY=0
let pselectX=0
let pselectY=0
let pauseCtx=false
let dt=0
let now=0
let animstart=0;
let prev=0;
let animX=0;
let animY=0;
let sx=0;
let sy=0;
let error=false
let gameOn=true
let matrix = []
let extraPieces = []
let treasures = []
let game;
let players=[]
let playercount=0
let tpp=0
let prevSelectX=null
let prevSelectY=null
//INIT
function initMatrix(){
    for(let i=0;i<7;i++){
        matrix[i] = []
        for(let j=0;j<7;j++){
            matrix[i].push({type: 0, r: 1, t: 0, owner: -1})
        }
    }
}

function initExtraPieces(){
    extraPieces=[]
    for(let i=0;i<13;i++){
        v=Math.floor(Math.random()*4+1)
        extraPieces.push({type: 1, r: v, t: 0, owner: -1})
    }
    for(let i=0;i<15;i++){
        v=Math.floor(Math.random()*4+1)
        extraPieces.push({type: 2, r: v, t: 0, owner: -1})
    }
    for(let i=0;i<6;i++){
        v=Math.floor(Math.random()*4+1)
        extraPieces.push({type: 3, r: v, t: 0, owner: -1})
    }
}

function initTreasures(tc, grid=7){
    treasures=[]
    let s;
    let g = grid-1
    let corners=['00','0'+g, g+'0', ''+g+g].join(',')

    for(let i=0;i<tc;i++){
        do{
        s = ''+(Math.floor(Math.random()*grid))+''+(Math.floor(Math.random()*grid))+''+(i%playercount)
        }while(treasures.map(n=>''+n[0]+n[1]).includes(''+s[0]+s[1]) || corners.includes(''+s[0]+s[1]));//while(treasures.includes(s) || corners.includes(''+s[0]+s[1]));
        treasures.push(s)
    }

    treasures.forEach(e=>{matrix[e[0]][e[1]].t=1
                          matrix[e[0]][e[1]].owner=e[2]})
}

function initMap(){
    matrix[0].forEach((n,i)=>{n.type=[2,0,3,0,3,0,2][i]
                              n.r=[1,1,1,1,1,1,4][i]})
    matrix[2].forEach((n,i)=>{n.type=[3,0,3,0,3,0,3][i]
                              n.r=[2,1,2,1,1,1,4][i]})
    matrix[4].forEach((n,i)=>{n.type=[3,0,3,0,3,0,3][i]
                              n.r=[2,1,3,1,4,1,4][i]})
    matrix[6].forEach((n,i)=>{n.type=[2,0,3,0,3,0,2][i]
                              n.r=[2,1,3,1,3,1,3][i]})
}

function getTc(id){
    let idTreasures=[]
    for(let i=0;i<treasures.length;i++){
        //console.log(treasures[i][2]+ '='+ id)
        if(Number(treasures[i][2])==id) { idTreasures.push(matrix[treasures[i][0]][treasures[i][1]]) }
    }
    return idTreasures
}

function startPos(id){
    return [[0,0,6,6][id],[0,6,0,6][id]];
}

function initPlayers(){
    players=[]
    scoreboard.innerHTML=''
    let t = scoreboard.appendChild(document.createElement('table'))
    let tr = t.appendChild(document.createElement('tr'))
    for(let i=0;i<playercount;i++){
        players.push({id: i, row:[0,0,6,6][i], column:[0,6,0,6][i], score: 0, tc: getTc(i), color: getColor(colors.querySelectorAll('input')[i].value)})
                      /*color: ('rgb(' + Math.floor(Math.random()*206+50) + ', ' +
                                       Math.floor(Math.random()*206+50) + ', ' + 
                                       Math.floor(255-i*63) + ')')})*/
        let td = tr.appendChild(document.createElement('td'))

        let p = td.appendChild(document.createElement('p'))
        p.innerText=`Player${i+1}: 0/${tcp.value}`
        p.style.backgroundColor=players[i].color
    }
}


//DRAW
function drawGrid(cx,s,grid = 7){
    size = s/grid;
    cx.fillStyle = 'rgb(65, 61, 58)'
    cx.strokeStyle = 'rgb(179, 130, 107)'
    for(let i=0;i<grid;i++){
        for(let j=0;j<grid;j++){
            
            cx.fillRect(j*size,i*size,size,size)
                cx.strokeRect(j*size,i*size,size,size)
        }
    }
}

function drawBox(row, column, cx, size, grid = 7, slide_x=0, slide_y=0){
    cx.fillStyle = 'rgb(65, 61, 58)'
    cx.strokeStyle = 'rgb(179, 130, 107)'
    const w=size/grid
    const move_x = (column*w)+slide_x
    const move_y = (row*w)+slide_y
    const x = 0
    const y = 0
    cx.fillRect(x+move_x,y+move_y,w,w)
    cx.strokeRect(x+move_x,y+move_y,w,w)
}

function drawError(row, column, cx, size, grid = 7){
    cx.fillStyle = ctx2.fillStyle='rgba(255, 0, 0, 0.35)'
    const w=size/grid
    const move_x = (column*w)
    const move_y = (row*w)
    const x = 0
    const y = 0
    cx.fillRect(x+move_x,y+move_y,w,w)
}

function drawAvailable(row, column, cx, size, grid = 7){
    cx.fillStyle = ctx2.fillStyle='rgba(0, 255, 0, 0.35)'
    const w=size/grid
    const move_x = (column*w)
    const move_y = (row*w)
    const x = 0
    const y = 0
    cx.fillRect(x+move_x,y+move_y,w,w)
}

function drawL(row, column, obj, cx, size, grid = 7, slide_x=0, slide_y=0){
    const cw=size
    const move_x = (column*cw/grid)+slide_x
    const move_y = (row*cw/grid)+slide_y
    rotate_1=Math.sign(Math.cos(obj.r*(Math.PI/2)));
    rotate_2=Math.sign(Math.sin(obj.r*(Math.PI/2)));
    const x = cw/(grid*2)-10
    const y = cw/(grid*2)
    cx.beginPath()
    cx.fillRect(x+move_x,y+move_y,20,rotate_1*y)
    cx.fillRect(y+move_x,x+move_y,rotate_2*y,20)
    cx.arc(cw/(grid*2)+move_x,cw/(grid*2)+move_y,10,0,2*Math.PI,true)
    cx.fill()
    cx.closePath()
}

function drawI(row, column, obj, cx, size, grid=7, slide_x=0, slide_y=0){
    const cw=size
    const move_x = (column*cw/grid)+slide_x
    const move_y = (row*cw/grid)+slide_y
    let x = 0
    let y = cw/(grid*2)-10
    let w = cw/grid
    let h = 20
    if(obj.r%2==0){
        [h, w, x, y] = [w, h, y, x]
    }
    cx.fillRect(x+move_x,y+move_y,w,h)
}

function drawT(row, column, obj, cx, size, grid=7, slide_x=0, slide_y=0){
    const cw=size
    const move_x=(column*cw/grid)+slide_x
    const move_y=(row*cw/grid)+slide_y
    let x =(cw/(grid*2)-10)
    let y =cw/(grid*2)
    let w = 20
    rotate=Math.sign(Math.sin(obj.r*(Math.PI/2)));
    let h = rotate*cw/(grid*2)
    if(obj.r%2==0){
        [h, w, x, y] = [w, h, y, x]
    }
    cx.fillRect(x+move_x,y+move_y,w,h)
    drawI(row,column,obj,cx,size,grid, slide_x, slide_y)
}

function drawTreasure(row,column,cx,size,grid=7, slide_x=0, slide_y=0)
{
    const cw=size
    const move_x=(column*cw/grid)+slide_x
    const move_y=(row*cw/grid)+slide_y
    const x = cw/(grid*2)+move_x;
    const y = cw/(grid*2)+move_y;
    cx.beginPath()

    cx.fillStyle="rgba(47,180,235,0.8)"
    for(let i=0;i<2;i++){
        let sign=(i==0?1:-1)
        cx.moveTo(x+sign*-12,y-1)
        cx.lineTo(x+sign*-4,y)
        cx.lineTo(x,y+15)
        cx.lineTo(x+sign*-12,y-1)
        cx.closePath()
        cx.fill()
    }

    for(let i=0;i<2;i++){
        let sign=(i==0?1:-1)
        cx.beginPath()
        cx.moveTo(x+sign*-7,y-7)
        cx.lineTo(x,y-7)
        cx.lineTo(x+sign*-5,y)
        cx.closePath()
        cx.fill()
    }

    cx.fillStyle="rgba(163,234,255,0.8)"
    for(let i=0;i<2;i++){
        let sign=(i==0?1:-1)
        cx.beginPath()
        cx.moveTo(x+sign*-4,y)
        cx.lineTo(x+sign*-7,y-7)
        cx.lineTo(x+sign*-13,y-1)
        cx.closePath()
        cx.fill()
    }

    cx.beginPath()
    cx.moveTo(x-5,y)
    cx.lineTo(x,y-7)
    cx.lineTo(x+5,y)
    cx.closePath()
    cx.fill()

    cx.fillStyle="rgba(100,218,255,0.8)"
    cx.beginPath()
    cx.moveTo(x-5,y)
    cx.lineTo(x+5,y)
    cx.lineTo(x,y+15)
    cx.lineTo(x-5,y)
    cx.closePath()
    cx.fill()
}

function draw(row, column, obj, cx, s, grid=7, slide_x=0, slide_y=0){
    cx.strokeStyle = cx.fillStyle = 'rgb(255, 193, 7)'
    switch(obj.type){
        case 0:
            break;
        case 1:
            drawI(row,column, obj, cx, s, grid, slide_x, slide_y)
            break;
        case 2:
            drawL(row,column, obj, cx, s, grid, slide_x, slide_y)
            break;
        case 3:
            drawT(row,column, obj, cx, s, grid, slide_x, slide_y)
            break;
        default:
    }
    
    if(obj.t==1) {drawTreasure(row,column,cx,s,grid,slide_x,slide_y)
        if(obj==players[curplayer].tc[players[curplayer].tc.length-1]){
            drawO(row,column,cx,s,grid,slide_x,slide_y)
        }
    
    }
}

function getTreasureCard(id){
    let tcoord = []
    let tc=players[id].tc[(players[id].tc.length-1)];
    if(tc!=undefined){
    matrix.forEach((n,r)=>{
        if(n.indexOf(tc)!=-1)  {tcoord[0]=r
                                tcoord[1]=n.indexOf(tc)}})
    }
    return tcoord
    
}


function drawO(row, column, cx, size, grid = 7, slide_x=0, slide_y=0){
    const cw=size
    const move_x = (column*cw/grid)+slide_x
    const move_y = (row*cw/grid)+slide_y+2
    const x = cw/(grid*2)-10
    const y = cw/(grid*2)
    cx.strokeStyle=players[curplayer].color
    cx.beginPath()
    cx.arc(cw/(grid*2)+move_x,cw/(grid*2)+move_y,20,0,2*Math.PI,true)
    cx.stroke()
    cx.closePath()
}


function drawComponents(cx, s, grid=7){
    matrix.forEach((t,r)=>t.forEach((n,c)=>draw(r,c,n,cx,s,grid)))
    players.forEach((n,i)=>{if(pausePlayer!=i) drawPolygon(n.row,n.column,n.id+3,10,n.color)})
    //let curTreasure = players[curplayer].tc
    //drawError(getTreasureCard(curplayer)[0],getTreasureCard(curplayer)[1],ctx,420,7)
    //drawO(getTreasureCard(curplayer)[0],getTreasureCard(curplayer)[1],ctx,420,7)
    //players.forEach((n,i)=>drawPolygon(n.row,n.column,i+3,15,'rgba(255,0,0,0.5)',cx,s,grid))
}

function drawArrow(row,column){
    ctx2.fillStyle = 'rgb(65, 61, 58)'
    const mx = (column*60)
    const my = (row*60)
    let x = [30, 20, 40];
    let y = [35, 25, 25];
    ctx2.beginPath();
    
    if(row==8 || column==8){
        [y[0],y[1],y[2]]=[y[1],y[0],y[0]]
    }

    if(column==0 || column==8){
        let tmp=y;
        y=x;
        x=tmp;
    }

    ctx2.moveTo(x[0]+mx,y[0]+my);  
    ctx2.lineTo(x[1]+mx,y[1]+my);
    ctx2.lineTo(x[2]+mx,y[2]+my);

    ctx2.fill();
    ctx2.closePath();
}

function drawArrows(){
    [2,4,6].forEach(n=>{drawArrow(0,n)
                        drawArrow(8,n)
                        drawArrow(n,0)
                        drawArrow(n,8)})
}

function drawExtraPiece(slide_x, slide_y){
    drawBox(selectY,selectX,ctx2,canvas2.width,9, slide_x, slide_y)
    draw(selectY,selectX,extraPieces[0],ctx2,canvas2.width,9, slide_x, slide_y)

    if(extraPieces[0]==players[curplayer].tc[players[curplayer].tc.length-1])
        drawO(selectY,selectX,ctx2,canvas2.width,9, slide_x, slide_y)
    if(error){
        drawError(selectY,selectX,ctx2,canvas2.width,9)
    }
}

function drawPolygon(row, column, n, a, color, cx=ctx, size=canvas.width, grid=7, slide_x=0, slide_y=0, rotate=0) {
    const cw=size
    const x=(column*cw/grid)+slide_x+(cw/grid/2)
    const y=(row*cw/grid)+slide_y+(cw/grid/2)
    cx.fillStyle=color
    cx.beginPath()
    const r = a / Math.sin(2.0 * Math.PI / n)
    const angle = (-3.0 * Math.PI / 2 - Math.PI / n) + rotate*(Math.PI/180.0)
    cx.moveTo( (x + r*Math.cos(angle)), (y + r*Math.sin(angle)) )
    for (let i=1; i <= n; i++) {
        cx.lineTo((x + r * Math.cos(2.0 * Math.PI * i / n + angle)), (y + r * Math.sin(2.0 * Math.PI * i / n + angle)))
    }
    cx.closePath()
    cx.fill()
}

function slideFrom(row, column, slide_x=0, slide_y=0){
    let nr=row-1;
    let nc=column-1;
    if(row==0 || row == 8){
        ctx.clearRect(60*(nc),0,60,420)
        let cArr = matrix.map(n=>(n.reduce((p,c,i)=>i==nc?c:p,{type: 0, r: 1})))
        cArr.forEach((n,r)=>{drawBox(r+1,column,ctx2,canvas2.width,9,slide_x, slide_y)
                             draw(r+1,column,n,ctx2,canvas2.width,9, slide_x, slide_y)})    

        players.forEach(n=>{if(n.column==selectX-1){drawPolygon(n.row+1,column,n.id+3,10,n.color,ctx2,canvas2.width,9,slide_x,slide_y)}})       
    }else if(column==0 || column==8){
        ctx.clearRect(0,60*(nr),420,60)
        let cArr = matrix[nr]
        cArr.forEach((n,c)=>{drawBox(row,c+1,ctx2,canvas2.width,9,slide_x, slide_y)
                             draw(row,c+1,n,ctx2,canvas2.width,9, slide_x, slide_y)})

        players.forEach(n=>{if(n.row==selectY-1){drawPolygon(row,n.column+1,n.id+3,10,n.color,ctx2,canvas2.width,9,slide_x,slide_y)}})   
    }
}

function clear(cx){
    cx.clearRect(0,0,1000,1000)
}


//Functions

function getColor(str){
    const r = parseInt(str.substr(1,2), 16)
    const g = parseInt(str.substr(3,2), 16)
    const b = parseInt(str.substr(5,2), 16)
    return (`rgb(${r}, ${g}, ${b})`)
}



function defcolor(i){
    switch(i){
        case 0: return '#00FBFF';
        case 1: return '#FF00C8'; 
        case 2: return '#469037'; 
        case 3: return '#0055FF'; 
    }
}

function getDirections(type, r)
{
    switch(type){
        case 1:
            if(r%2==1){ return ['right', 'left']} else { return ['up', 'down'] }
            break;
        case 2:
            switch(r){
                case 1: return ['right', 'down']
                case 2: return ['up', 'right']
                case 3: return ['up', 'left']
                case 4: return ['down', 'left']
            }
            break;
        case 3:
            switch(r){
                case 1: return ['right', 'down', 'left']
                case 2: return ['up', 'right', 'down']
                case 3: return ['up', 'right', 'left']
                case 4: return ['up', 'down', 'left']
            }
            break;
        default:
            return 'stop'
    } 
}

let shortpath=[]
let available=[]
/*function neighbour(row, col, prev, path=[]){
    let available = []
    let pathWalked = path
    if(pathWalked.includes(''+row+col)) { return 0 }
    pathWalked.push(''+row+col)
    available = getDirections(matrix[row][col].type, matrix[row][col].r)
    available=available.filter(n=>n!=prev)
    if(row==0){available=available.filter(n=>n!='up')}
    else if(row==6){available=available.filter(n=>n!='down')}
    if(col==0){available=available.filter(n=>n!='left')}
    else if(col==6){available=available.filter(n=>n!='right')}


    for(let i=0;i<available.length;i++){
        if(available[i]=='right'){
            let rA = getDirections(matrix[row][col+1].type, matrix[row][col+1].r)
            if(rA.includes('left') && !(pathWalked.includes(''+row+(col+1))) ){
                drawAvailable(row,col+1,ctx,420,7)
                neighbour(row,col+1,'left',pathWalked)
            }
        }
        if(available[i]=='down'){
            let dA = getDirections(matrix[row+1][col].type, matrix[row+1][col].r)
            if(dA.includes('up') && !(pathWalked.includes(''+(row+1)+col)) ){
                drawAvailable(row+1,col,ctx,420,7)
                neighbour(row+1,col,'up',pathWalked)
            }
        }
        if(available[i]=='left'){
            let rA = getDirections(matrix[row][col-1].type, matrix[row][col-1].r)
            if(rA.includes('right') && !(pathWalked.includes(''+row+(col-1)))){
                drawAvailable(row,col-1,ctx,420,7)
                neighbour(row,col-1,'right',pathWalked)
            }
        }
        if(available[i]=='up'){
            let dA = getDirections(matrix[row-1][col].type, matrix[row-1][col].r)
            if(dA.includes('down')  && !(pathWalked.includes(''+(row-1)+col))){
                drawAvailable(row-1,col,ctx,420,7)
                neighbour(row-1,col,'down',pathWalked)
            }
        }
    }

    
}*/

function drawArray(arr){
    for(let i=0;i<arr.length;i++){
        drawAvailable(arr[i][0],arr[i][1],ctx,canvas.width,7)
    }
}

function neighbour2(row, col, prev, path=[], avbl=available){
    if(!matrix[row][col]) return 0
    let dir=getDirections(matrix[row][col].type, matrix[row][col].r)
    let l = dir.length
    
    let pathwalked = path.map(n=>n) // hogy ne referencia legyen
    if(pathwalked.includes(''+row+col)) {return 0}
    avbl.push(''+row+col)
    //avbl=Set(avbl)
    pathwalked.push(''+row+col)

    dir=dir.filter(n=>n!=prev)

    if(row==0){dir=dir.filter(n=>n!='up')}
    else if(row==6){dir=dir.filter(n=>n!='down')}
    if(col==0){dir=dir.filter(n=>n!='left')}
    else if(col==6){dir=dir.filter(n=>n!='right')}

    let filtered = []
    let dirNext=[]

    for(let i=0;i<l;i++){
        switch(dir[i]){
            case 'up':
                dirNext=getDirections(matrix[row-1][col].type, matrix[row-1][col].r)
                if(dirNext.includes('down') && !pathwalked.includes(''+(row-1)+col)){
                    neighbour2(row-1,col,'down', pathwalked)
                    //available.push(''+(row-1)+col)
                    //drawAvailable(row-1,col,ctx,canvas.width,7)
                }else{filtered.push('up')}
                break;
            case 'right':
                dirNext=getDirections(matrix[row][col+1].type, matrix[row][col+1].r)
                if(dirNext.includes('left') && !pathwalked.includes(''+row+(col+1))){
                    neighbour2(row,col+1,'left', pathwalked)
                    //available.push(''+row+(col+1))
                    //drawAvailable(row,col+1,ctx,canvas.width,7)
                }else{filtered.push('right')}
                break;
            case 'down':
                dirNext=getDirections(matrix[row+1][col].type, matrix[row+1][col].r)
                if(dirNext.includes('up') && !pathwalked.includes(''+(row+1)+col)){
                    neighbour2(row+1,col,'up', pathwalked)
                    //available.push(''+(row+1)+col)
                    //drawAvailable(row+1,col,ctx,canvas.width,7)
                }else{filtered.push('down')}
                break;
            case 'left':
                dirNext=getDirections(matrix[row][col-1].type, matrix[row][col-1].r)
                if(dirNext.includes('right') && !pathwalked.includes(''+row+(col-1))){
                    neighbour2(row,col-1,'right', pathwalked)
                    //available.push(''+row+(col-1))
                    //drawAvailable(row,col-1,ctx,canvas.width,7)
                }else{filtered.push('left')}
                break;
        }
    }
    dir=dir.filter(n=>!filtered.includes(n))
    if(''+row+col==''+pselectY+pselectX) shortpath=pathwalked // console.log(`[${pselectY}][${pselectX}]: ${pathwalked}`)
    //if(dir.length==0) drawError(row,col,ctx,canvas.width,7)
    
}

function Fisher_Yates_Shuffle(arr){
    for(let i=arr.length-1;i>0;i--){
        let j = Math.floor(Math.random()*(i+1));
        
        [arr[j], arr[i]] = [arr[i], arr[j]];
    }
}

function setSlide(row,column){
    if(row==0){
        sx=0
        sy=0.12
    }else if(row==8){
        sx=0
        sy=-0.12
    }else if(column==0){
        sx=0.12
        sy=0
    }else if(column==8){
        sx=-0.12
        sy=0
    }
}

function updateTreasures(){
    treasures=[]
    matrix.forEach((n,r)=>n.forEach((e,c)=>{if(e.t==1) treasures.push(''+r+c+e.owner)}))

}

function rotateExtraPiece(){
    //console.log((extraPieces[0].r%4)+1);
    extraPieces[0].r=(extraPieces[0].r  )%4+1
}

function fillMap(arr){
    for(let i=0;i<7;i++){
        for(let j=0;j<7;j++){
            if(matrix[i][j].type==0)
                matrix[i][j]=arr.pop()
        }
    }
}

function changetiles(row,column){
    if(pauseCtx){
        if(row==0){
            let tmp=matrix[6][selectX-1]
            for(let i=6;i>0;i--){ matrix[i][selectX-1]=matrix[i-1][selectX-1] }
            matrix[0][selectX-1]=extraPieces[0]
            extraPieces[0]=tmp

            players.forEach(n=>{
                if(n.column==selectX-1){n.row=(n.row+1)%7}
            })
        }
        else if(row==8){
            let tmp=matrix[0][selectX-1]
            for(let i=0;i<6;i++){ matrix[i][selectX-1]=matrix[i+1][selectX-1] }
            matrix[6][selectX-1]=extraPieces[0]
            extraPieces[0]=tmp

            players.forEach(n=>{
                if(n.column==selectX-1){n.row=(n.row-1<0?6:n.row-1)}
            })
        }
        else if(column==0){
            let tmp=matrix[selectY-1][6]
            for(let i=6;i>0;i--){ matrix[selectY-1][i]=matrix[selectY-1][i-1] }
            matrix[selectY-1][0]=extraPieces[0]
            extraPieces[0]=tmp

            players.forEach(n=>{
                if(n.row==selectY-1){n.column=(n.column+1)%7}
            })
        }
        else if(column==8){
            let tmp=matrix[selectY-1][0]
            for(let i=0;i<6;i++){ matrix[selectY-1][i]=matrix[selectY-1][i+1] }
            matrix[selectY-1][6]=extraPieces[0]
            extraPieces[0]=tmp

            players.forEach(n=>{
                if(n.row==selectY-1){n.column=(n.column-1<0?6:n.column-1)}
            })
        }
        updateTreasures()
    }
}



function isAcross(){
    if((selectY==0 || selectY==8) && selectX==prevSelectX){
        return selectY==8-prevSelectY
    }else if((selectX==0 || selectX==8) && selectY==prevSelectY){
        return selectX==8-prevSelectX
    }
    return false
}

function checkError(){
    error=false
    if(!'02,04,06,82,84,86'.includes(''+selectY+selectX) && !'02,04,06,82,84,86'.includes(''+selectX+selectY) || isAcross()){
        error=true
    }
}


function slideanim(){
    animX+=sx*dt
    animY+=sy*dt
    slideFrom(selectY,selectX,animX,animY)
}

function slideover(){
    changetiles(selectY,selectX)
    pauseCtx=false
    animX=0
    animY=0
}

function animate(time,during,done,animating){
    if(animating){
            during()
        if(now-animstart>time && now-animstart<time+500){
            done()
            neighbour2(players[curplayer].row,players[curplayer].column)
           
            if(available.length==1) {
                available=[]
                curplayer++
                if(curplayer==playercount) curplayer=0
                stage=1
            }
        }
    }
}

let seged=true

let x=0,y=0
let mostr=0,mostc=0
let last=0
let pausePlayer=-1
/*let newes=''
let once=true
let counter=1*/
let anim2=false
let anim2start=0
/*let volt = []
let curX=0
let curY=0*/



function moveplayer(){
    let i = 0+Math.floor((now-anim2start)/500)
    let n=players[curplayer]
    if(anim2){
    if(shortpath.length>0 && i<shortpath.length){

        //n.row=Number(shortpath[last][0])
        //n.column=Number(shortpath[last][1])
        
        //console.log(mostr+' '+mostc)
        x=x+(0.12*dt)*mostc
        y=y+(0.12*dt)*mostr
        drawPolygon(n.row,n.column,n.id+3,10,n.color,ctx,canvas.width,7,x,y)
        if(i!=last){
            mostr=Number(shortpath[i][0])-Number(shortpath[last][0])
            mostc=Number(shortpath[i][1])-Number(shortpath[last][1])
            n.row=Number(shortpath[last][0])
            n.column=Number(shortpath[last][1])
            x=y=0
            last=i
        }
        
        //n.row=Number(shortpath[last][0])
        //n.column=Number(shortpath[last][1])
    }else{
          if(i==shortpath.length && shortpath.length>0) { n.row=Number(shortpath[i-1][0])
            n.column=Number(shortpath[i-1][1])
            available=[]
          }
          if(players[curplayer].row==getTreasureCard(curplayer)[0] && players[curplayer].column==getTreasureCard(curplayer)[1]){
                players[curplayer].score++
                matrix[getTreasureCard(curplayer)[0]][getTreasureCard(curplayer)[1]].t=0
                players[curplayer].tc.pop()
                scoreboard.querySelectorAll('p')[curplayer].innerText=`Player${curplayer+1}: ${players[curplayer].score}/${tcp.value}`
                if(players[curplayer].tc.length==0){// && pselectY==startPos(curplayer)[0] && pselectX==startPos(curplayer)[1]){
                   // gf.classList.add('rejtett')
                    //console.log(pselectX+ ' ' + pselectY + ' ' + startPos(curplayer))
                    //console.log(curplayer+' nyert!');
                }
            }
          if(players[curplayer].tc.length==0 && players[curplayer].row==startPos(curplayer)[0] && players[curplayer].column==startPos(curplayer)[1]){
              canvas.style.filter = 'blur(12px)'
              gameOn=false
              winner.querySelector('span').innerText=`Player${curplayer+1} won the game!`
              winner.classList.remove('rejtett')
              //pauseCtx=true
          }
          if(playervaltas) curplayer++
          if(curplayer==playercount) curplayer=0
          playervaltas=false
          x=y=0
          mostc=mostr=0
          shortpath=[]
          last=0
          pausePlayer=-1
          anim2=false}
    }
}







/*function moveplayer(){
    let i = 0+Math.floor((now-anim2start)/500)
    let n=players[0]
    if(anim2){
    if(shortpath.length>1 && i<shortpath.length-1){
        if(i!=last){
            last=i
            players[0].row=Number(shortpath[i][0])
            players[0].column=Number(shortpath[i][1])
            x=0;
            y=0;
            console.log(shortpath[i])
        }
    }else{
          if(i==shortpath.length-1) { n.row=Number(shortpath[i][0])
            n.column=Number(shortpath[i][1])
          }
          shortpath=[]
          last=0
          //pauseCtx=false
          anim2=false}
    }
}*/



/*function moveplayer(){
    let i = 1+Math.floor((now-anim2start)/500)
    if(shortpath.length > 1 && i<shortpath.length){
        if(i!=last){
            last=i
            players[0].row=shortpath[i][0]
            players[0].column=shortpath[i][1]
        }
       
    }else{shortpath=[]}
}*/


/*function moveplayer(){
    let n=players[0]
    if(anim2 && shortpath.length>1){
        if(counter<shortpath.length){
            

            
            mostr=shortpath[counter][0]-curY
            mostc=shortpath[counter][1]-curX
            x=x+(0.12*dt)*mostc
            y=y+(0.12*dt)*mostr
            lastX=curX
            lastY=curY
            drawPolygon(n.row,n.column,n.id+3,10,n.color,ctx,canvas.width,7,x,y)
            curX = Math.floor((x/(canvas.width/7)*(canvas.width/7))/60)
            curY = Math.floor((y/(canvas.width/7)*(canvas.width/7))/60)
            if(curX!=lastX || curY!=lastY) counter++
        }else{
            anim2=false
            n.row=curY
            n.column=curX
        }
    }
}*/

/*function moveplayer(){
    if(shortpath.length>0){
        
        if(counter<shortpath.length){
            console.log('most')
            
            let n=players[0]
            if(seged){
                newes = shortpath[counter]
                seged=false
                mostr=newes[0]-last[0]
                mostc=newes[1]-last[1]
                last=newes
                counter++
            }
            
            x=x+(0.12*dt)*mostc
            y=y+(0.12*dt)*mostr   
            //console.log(newr + ' ' +newc)
            
            drawPolygon(n.row,n.column,n.id+3,10,n.color,ctx,canvas.width,7,x,y)
        }else{ seged = true}
    }
}*/
let stage=1
let curplayer=0
let counter=0

/*function nextRound(){
    //console.log(curplayer+' '+stage)
    counter++
    if(counter==3) {curplayer++
                    counter=0}
    if(curplayer==playercount) curplayer=0
    stage=(stage==1)?2:1


}*/


function render(){
    if(!gameOn) return 0;
    now=performance.now();
    if(!pauseCtx){
        clear(ctx)
        drawGrid(ctx,canvas.width)
        drawComponents(ctx,canvas.width)
        //neighbour(0,0)
        //available=[]
        //neighbour2(players[0].row,players[0].column)
        //if(shortpath.length>0) drawArray(shortpath)
        //available=[]
        //neighbour2(players[curplayer].row,players[curplayer].column)
        //available = available.filter((n, i, s) => s.indexOf(n) == i) lassabb
        available=[... new Set(available)]
        drawArray(available)
        gf.style.backgroundColor=players[curplayer].color
    }
    clear(ctx2) 
    drawArrows()
    drawExtraPiece(animX,animY)
    animate(500,slideanim,slideover,pauseCtx)
    moveplayer()
    //animate(500,slidePlayer,playerslideover,pauseCtx)
    /*if(pauseCtx){
        animX+=sx*dt
        animY+=sy*dt
        slideFrom(selectY,selectX,animX,animY)
    }
    if(now-animstart>500 && now-animstart<1000){
        changetiles(selectY,selectX)
        pauseCtx=false
        animX=0
        animY=0
    }*/
    //drawPolygon(0,2,5,20,'rgb(255,0,0)',ctx,420,7,0,0)
    


    //players.forEach((n,i)=>drawPolygon(n.row,n.column,n.id+3,10,n.color))
    dt=now-prev;
    prev=now;
    window.requestAnimationFrame(render)
}

function initvariables(){
    selectX=0
    selectY=0
    pselectX=0
    pselectY=0
    pauseCtx=false
    dt=0
    now=0
    animstart=0;
    prev=0;
    animX=0;
    animY=0;
    sx=0;
    sy=0;
    error=false
    matrix = []
    extraPieces = []
    treasures = []
    players=[]
    playercount=0
    shortpath=[]
    available=[]
    seged=true
    x=0,y=0
    mostr=0,mostc=0
    last=0
    pausePlayer=-1
    anim2=false
    anim2start=0
    stage=1
    curplayer=0
    counter=0
    gameOn=true
    prevSelectX=null
    prevSelectY=null
    canvas.style.filter=''
}



function savevariables(){
game={
    selectX,
    selectY,
    pselectX,
    pselectY,
    pauseCtx,
    dt,
    now,
    animstart,
    prev,
    animX,
    animY,
    sx,
    sy,
    error,
    matrix,
    extraPieces,
    treasures,
    players,
    playercount,
    shortpath,
    available,
    seged,
    x,
    y,
    mostr,
    mostc,
    last,
    pausePlayer,
    anim2,
    anim2start,
    stage,
    curplayer,
    counter,
    gameOn,
    prevSelectX,
    prevSelectY,
    tpp
    }
    localStorage.clear()
    localStorage.setItem('game',JSON.stringify(game));
    load.style.opacity='100%'
}
    


function findtreasure(id){
    updateTreasures()
    let cells=matrix.map((n)=>n.filter((m)=>m.t==1)).filter(n=>n.length>0)
    players[id].tc=players[id].tc.map(m=>cells.reduce((p,c)=>c.filter(n=>JSON.stringify(n)==JSON.stringify(m)).length>0?c.filter(n=>JSON.stringify(n)==JSON.stringify(m)):p,[])[0])
}

function loadvariables(){
    let save = JSON.parse(localStorage.getItem('game'))
    selectX=save.selectX
    selectY=save.selectY
    pselectX=save.pselectX
    pselectY=save.pselectY
    pauseCtx=save.pauseCtx
    dt=save.dt
    now=save.now
    animstart=save.animstart
    prev=save.prev
    animX=save.animX
    animY=save.animY
    sx=save.sx
    sy=save.sy
    error=save.error
    matrix=save.matrix
    extraPieces=save.extraPieces
    treasures=save.treasures
    players=save.players
    playercount=save.playercount
    shortpath=save.shortpath
    available=save.available
    seged=save.seged
    x=save.x
    mostr=save.mostr
    last=save.last
    pausePlayer=save.pausePlayer
    anim2=save.anim2
    anim2start=save.anim2start
    stage=save.stage
    curplayer=save.curplayer
    counter=save.counter
    gameOn=save.gameOn
    prevSelectX=save.prevSelectX
    prevSelectY=save.prevSelectY
    players.forEach((n,i)=>findtreasure(i))
    tpp=save.tpp
}

//EventListeners

save.addEventListener('click',function(){
    if(!pauseCtx && pausePlayer==-1){
    savevariables()
    }
})

load.addEventListener('click',function(){
    if(load.style.opacity=='1' && !pauseCtx && pausePlayer==-1){
        loadvariables()
        pc.value=playercount
        pc.dispatchEvent(new Event('input'))
        tcp.value=tpp
        start.click()
        loadvariables()
    }
})

load2.addEventListener('click',function(){
    if(load.style.opacity=='1'){
        loadvariables()
        pc.value=playercount
        pc.dispatchEvent(new Event('input'))
        tcp.value=tpp
        start.click()
        loadvariables()
    }
})

howto.addEventListener('click',function(){
    desc.classList.toggle('rejtett')
})

pc.addEventListener('input',function(){
    if(Number(pc.value)>0 && Number(pc.value)<=4){
        tcp.max = 24 / Number(pc.value)

        if(Number(tcp.value)>Number(tcp.max))
            tcp.value=tcp.max

        colors.innerHTML = ''
        for(let i=0;i<pc.value;i++){
            let input = colors.appendChild(document.createElement('input'))
            input.type = 'color'
            input.value = defcolor(i)
        }
    }
})


restart.addEventListener('click',function(){
    gf.classList.add('rejtett')
    cp.classList.remove('rejtett')
})

start.addEventListener('click',function(){
    document.querySelector('#preload').classList.add('rejtett')
    winner.classList.add('rejtett')
    cp.classList.add('rejtett')
    tcp.style=(Number(tcp.value)<=Number(tcp.max) && Number(tcp.value)>0)?'':'background-color:red'
    pc.style=(Number(pc.value)>0 && Number(pc.value)<=4)?'':'background-color:red'
    if(Number(tcp.value)<=Number(tcp.max) && Number(pc.value)>0 && Number(pc.value)<=4 && Number(tcp.value)>0)
    {
    initvariables()
    playercount=pc.value
    tpp=tcp.value
    initMatrix()
    initExtraPieces()
    Fisher_Yates_Shuffle(extraPieces)
    initMap()
    fillMap(extraPieces)
    initTreasures(tcp.value*pc.value)
    initPlayers()
    //console.log(players[curplayer].tc);
    stage=1
    curplayer=0
    available=[]
    playervaltas=false
    
    gf.classList.remove('rejtett')
    window.requestAnimationFrame(render)
    }
})

function clamp(num, min, max){
    return Math.min(Math.max(num, min), max)
}

canvas2.addEventListener('mousemove',function(e){
    if(!pauseCtx){
    let rect = canvas2.getBoundingClientRect()
    let i = e.clientX-rect.left;
    let j = e.clientY-rect.top;
    selectX = clamp(Math.floor((i/(canvas2.width/9)*(canvas2.width/9))/60),0,8)
    selectY = clamp(Math.floor((j/(canvas2.width/9)*(canvas2.width/9))/60),0,8)
    checkError()
    }
})

canvas2.addEventListener('click',function(e){
    if(!pauseCtx && stage==1){
        let rect = canvas2.getBoundingClientRect()
        let i = e.clientX-rect.left;
        let j = e.clientY-rect.top;
        selectX = Math.floor((i/(canvas2.width/9)*(canvas2.width/9))/60)
        selectY = Math.floor((j/(canvas2.width/9)*(canvas2.width/9))/60)
        checkError()
        if(!error){
            prevSelectX=selectX
            prevSelectY=selectY
            pauseCtx=true
            animstart=performance.now()
            setSlide(selectY,selectX)
            
            stage++
        }
    }
})

let playervaltas=false

canvas2.addEventListener('contextmenu',function(e){
    e.preventDefault()
    rotateExtraPiece()
})

canvas.addEventListener('click',function(e){
    if(!pauseCtx && pausePlayer==-1 && stage==2){
        let rect = canvas.getBoundingClientRect()
        let i = e.clientX-rect.left;
        let j = e.clientY-rect.top;
        pselectX = Math.floor((i/(canvas.width/7)*(canvas.width/7))/60)
        pselectY = Math.floor((j/(canvas.width/7)*(canvas.width/7))/60)
        //shortpath=[]
        //neighbour2(pselectY,pselectX)
        available=[]
        
            
            neighbour2(players[curplayer].row,players[curplayer].column)
            if(shortpath.length>0){
                anim2=true
                anim2start=performance.now()
                pausePlayer=curplayer

                stage=1
                playervaltas=true
            }
        }
})

canvas.addEventListener('contextmenu',function(e){
    if(!pauseCtx && pausePlayer==-1){
        e.preventDefault()
        let rect = canvas.getBoundingClientRect()
        let i = e.clientX-rect.left;
        let j = e.clientY-rect.top;
        pselectX = Math.floor((i/(canvas.width/7)*(canvas.width/7))/60)
        pselectY = Math.floor((j/(canvas.width/7)*(canvas.width/7))/60)
        //shortpath=[]
        //neighbour2(pselectY,pselectX)
        //neighbour2(players[0].row,players[0].column)
        //players[0].row=pselectY
        //players[0].column=pselectX
        }
})
