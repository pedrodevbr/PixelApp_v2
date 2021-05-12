// Global variables
let img_array = []
let blocked_pixels = []
let image_id = ''
let delay = 250
let bp = {}
let features = {}
const N_LOOPS = 40 // number of time the melt function will loop

//Get array of pixels that have to be blocked on each image
fetch('blocked_pixels.json')
    .then(response=>response.json())
    .then(data=>{bp = data}) 

//Get which pictures have which features
fetch('feature_map.json')
    .then(response=>response.json())
    .then(data=>{features = data}) 

//Melt will receive the image array and draw on the canvas(resutlt_image)
async function melt(img_array,blocked_pixels){
    const BACKGROUND_COLOR = 'A0A0A0'
    let img_array_melted = img_array
    for (let i = 0;i<N_LOOPS;i++){
        document.addEventListener('keypress',function (e){
            if (e.key === 'Enter'){i = N_LOOPS+1} //To exit the for loop
        })  
                
        for (let index = 24*24 ; index > 0; index--){
            y = Math.floor(index/24)
            x = index%24
            if(blocked_pixels.includes(`${x}:${y}`)){
                continue
            }
            if(img_array_melted[index]==BACKGROUND_COLOR){
                continue
            }
            else if (x==23){ //right border
                if (img_array_melted[x-1+(y+1)*24] == BACKGROUND_COLOR){
                    img_array_melted[x-1+(y+1)*24] = img_array_melted[x+y*24]}
            }
            else if (x==0){//#left border
                if (img_array_melted[x+1+(y+1)*24] == BACKGROUND_COLOR){
                    img_array_melted[x+1+(y+1)*24] = img_array_melted[x+y*24]}
            }
            else{
                
                //console.log(x,y)
                var y_down = y+1
                var x_right= x-1
                var x_left = x+1
                //Pixels goes throught the fixed features
                while (blocked_pixels.includes(`${x}:${y_down}`)){
                    y_down+=1
                    while (blocked_pixels.includes(`${x_right}:${y_down}`)){
                        x_right-=1
                        if(x_right==0){break} 
                    }
                    while (blocked_pixels.includes(`${x_left}:${y_down}`)){
                        x_left+=1
                        if(x_left==23){break}
                    }
                }

                if(img_array_melted[x+y_down*24]==BACKGROUND_COLOR){
                    img_array_melted[x+y_down*24] = img_array_melted[x+y*24]
                    img_array_melted[x+y*24] = BACKGROUND_COLOR
                }
                /*Randomness
                else if (img_array_melted[x_right+y_down*24] == BACKGROUND_COLOR && img_array_melted[x_left+y_down*24] == BACKGROUND_COLOR){
                    d = Math.round(Math.random())
                    //console.log(d)
                    img_array_melted[(x+d)+y_down*24] = img_array_melted[x+y*24]
                    img_array_melted[x+y*24] = BACKGROUND_COLOR
                }*/
                else if (img_array_melted[x_right+y_down*24] != BACKGROUND_COLOR && img_array_melted[x_left+y_down*24] == BACKGROUND_COLOR){
                    img_array_melted[x_left+y_down*24] = img_array_melted[x+y*24]
                    img_array_melted[x+y*24] = BACKGROUND_COLOR
                }
                else if (img_array_melted[x_right+y_down*24] == BACKGROUND_COLOR && img_array_melted[x_left+y_down*24] != BACKGROUND_COLOR){
                    img_array_melted[x_right+y_down*24] = img_array_melted[x+y*24]
                    img_array_melted[x+y*24] = BACKGROUND_COLOR
                }
                else{
                    continue
                }                                           
            }
        }
        await sleep(delay);
        draw_image(img_array_melted,"result_image") 
    }
}

function rotate(){
    let img_array_rotated = []
    for (let index = 24*24  ; index >= 0; index--){
        y       = Math.floor(index/24)
        x       = index%24
        a_index = x+y*24
        b_index = (y)+(23-x)*24
        img_array_rotated[b_index] = img_array[a_index]
    }
    img_array =  img_array_rotated
    draw_image(img_array_rotated,'selected_image')
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function draw_image(img_array,canvas){
    const pixel_size = 10
    var canvas = document.getElementById(canvas);
    var context = canvas.getContext("2d");
    img_array.forEach(function(profile,index){
        x = Math.floor(index/24)
        y = index%24
        context.fillStyle = '#'+profile;
        context.fillRect(y*pixel_size, x*pixel_size, pixel_size, pixel_size);
    })
}

//Get json and transform in a image array 
function decode(data){
    let img_array =[]
    BACKGROUND_COLOR = 'A0A0A0'
    for (let index = 0; index < 24*24; index++){
        img_array[index] = BACKGROUND_COLOR
    }
    for (let index = 0; index < data.length; index++){ 
        element = data[index]
        x = parseInt(element.x)
        y = parseInt(element.y)
        img_array[y*24+x] = element.color
    }
    return img_array
}

//Every time the user input a number it will get the value of input box and draw the image
document.addEventListener('input',()=>{
    image_id = parseInt(document.getElementById('image_id input').value)
    document.getElementById('features_found').innerText = ''
    for(let key of features[image_id]){
        document.getElementById('features_found').innerText += key+'\n'
    }
    if (isNaN(image_id) || image_id>10000){
        image_id='not_found'
    }
    let data_src = `./images/json images/${image_id}.json`

    fetch(data_src)
        .then(response=>response.json())
        .then(data=>{                      
            img_array = decode(data)
            draw_image(img_array,'selected_image')
        })                     
});

//When the user press enter it will 'melt' the image
document.addEventListener('keypress',function (e){
    if (e.key === 'Enter'){
        blocked_pixels = bp[image_id]
        if(blocked_pixels===undefined){
            blocked_pixels=[]
        }
        delay = 1000/parseInt(document.getElementById('fps').value)
        if (isNaN(delay)){
            delay=250
        }
        console.log(delay)
        melt(img_array,blocked_pixels)
    }
});
