let fish_body = [ 
  [ 116.9185,  102.6403 ],
  [ 120.7168,   89.7261 ],
  [ 134.3908,   75.2924 ],
  [ 151.8630,   64.6571 ],
  [ 165.5370,   61.6185 ],
  [ 178.4513,   60.0992 ],
  [ 197.4429,   60.0992 ],
  [ 221.7521,   63.8975 ],
  [ 239.2244,   68.4555 ],
  [ 255.9370,   75.2924 ],
  [ 270.3706,   81.3697 ],
  [ 283.2849,   66.1765 ],
  [ 293.9202,   55.5412 ],
  [ 301.5168,   47.1849 ],
  [ 307.5941,   44.1462 ],
  [ 315.9504,   50.9832 ],
  [ 318.2294,   59.3395 ],
  [ 318.2294,   73.7731 ],
  [ 297.7185,  116.3143 ],
  [ 320.5084,  156.5765 ],
  [ 321.2681,  170.2504 ],
  [ 315.1908,  180.1261 ],
  [ 308.3538,  185.4437 ],
  [ 297.7185,  180.8857 ],
  [ 272.6496,  147.4605 ],
  [ 254.4176,  154.2975 ],
  [ 236.9454,  161.1345 ],
  [ 216.4345,  164.1731 ],
  [ 195.1639,  165.6924 ],
  [ 172.3739,  165.6924 ],
  [ 154.1420,  161.1345 ],
  [ 135.1504,  152.7782 ],
  [ 124.5151,  141.3832 ],
  [ 116.9185,  127.7092 ],
  [ 119.1975,  122.3916 ],
  [ 141.2277,  117.0739 ],
  [ 137.4294,  112.5160 ],
  [ 116.9185,  102.6403 ]];


let fish_upper_fin = [   [169.9096, 60.0080 ],
                      [177.1416,   51.3296 ],
                      [190.8824,   44.8208 ],
                      [207.5160,   39.0352 ],
                      [224.8728,   37.5888 ],
                      [240.7832,   41.2048 ],
                      [248.7384,   51.3296 ],
                      [249.4616,   62.9008 ],
                      [245.8456,   70.1328 ]];
                            
let fish_lower_fin = [
  [ 155.0102,  163.8204 ],
  [ 158.7000,  173.6599 ],
  [ 170.3844,  180.4245 ],
  [ 180.8388,  184.7293 ],
  [ 194.9830,  189.6490 ],
  [ 210.9721,  193.3388 ],
  [ 230.6510,  195.7986 ],
  [ 244.7952,  194.5687 ],
  [ 252.7898,  187.8041 ],
  [ 253.4048,  175.5048 ],
  [ 246.6401,  167.5102 ],
  [ 241.7204,  158.2857 ]];


let fish_eye = [ 
  [ 151.5883,   90.7226 ],
  [ 154.3993,   84.5386 ],
  [ 161.1455,   82.2898 ],
  [ 167.3296,   81.7276 ],
  [ 173.5137,   87.3495 ],
  [ 173.5137,   96.3445 ],
  [ 166.2052,   101.9664 ],
  [ 157.7724,   100.2799 ],
  [ 152.7127,   96.9067 ]];


const offsetX = +170; 
const offsetY = +120;

let smoothing = 0.2;
const controlPointCalc  = controlPoint(line, smoothing);
const bezierCommandCalc = bezierCommand(controlPointCalc);


function FishData (attr) {

  this.eye        = [];
  this.body       = [];
  this.upper_fin  = [];
  this.lower_fin  = [];
  this.outline    = [];
  this.attr       = attr;

}


class Fish {

  constructor (paper) {

    this.paper = paper;

    this.inner = new FishData ({ fill: "none", stroke: "#FFFFFF", "stroke-width" : 4 });
    this.outer = new FishData ({ fill: "none", stroke: "#000000", "stroke-width" : 8 });

    this.createFish ();

  }

  hide () {
    this.set.hide ();     
  }

  show () {
    this.set.show ();     
  }

  animate (attr) {
    this.set.animate (attr);
  }

  attr (val) {

    console.log (val);
    log (val['inner-stroke-width']);

    this.inner.outline.attr ( { "stroke-width" : val['inner-stroke-width'] } );
    this.outer.outline.attr ( { "stroke-width" : val['outer-stroke-width'] } );
    
    //console.log ( this.inner.outline.attr () ); //(which_attr); 
    //console.log ( this.inner.outline.attr () ); // (which_attr); 
  }

  createFish () {

    let paper = this.paper;

    /* modified */

    let _fish_body = fish_body.map (elem => {return [elem[0]-offsetX, elem[1]-offsetY]});
    let _fish_upper_fin = fish_upper_fin.map (elem => {return [elem[0]-offsetX, elem[1]-offsetY]});
    let _fish_lower_fin = fish_lower_fin.map (elem => {return [elem[0]-offsetX, elem[1]-offsetY]});
    let _fish_eye = fish_eye.map (elem => {return [elem[0]-offsetX, elem[1]-offsetY]});

    /* */

    this.outer.eye       = paper.path(svgPathString(_fish_eye, bezierCommandCalc)+'z');
    this.outer.body      = paper.path(svgPathString(_fish_body, bezierCommandCalc)+'z');
    this.outer.upper_fin = paper.path(svgPathString(_fish_upper_fin, bezierCommandCalc));
    this.outer.lower_fin = paper.path(svgPathString(_fish_lower_fin, bezierCommandCalc));
    this.outer.outline   = paper.set (this.outer.body, this.outer.eye, this.outer.upper_fin, this.outer.lower_fin)
                              .attr(this.outer.attr);

    /* */ 

    this.inner.eye       = paper.path(svgPathString(_fish_eye, bezierCommandCalc)+'z');
    this.inner.body      = paper.path(svgPathString(_fish_body, bezierCommandCalc)+'z');
    this.inner.upper_fin = paper.path(svgPathString(_fish_upper_fin, bezierCommandCalc));
    this.inner.lower_fin = paper.path(svgPathString(_fish_lower_fin, bezierCommandCalc));
    this.inner.outline   = paper.set (this.inner.body, this.inner.eye, this.inner.upper_fin, this.inner.lower_fin)
                                .attr(this.inner.attr)
                                .toFront ();


    this.set = paper.set(this.outer.outline, this.inner.outline);

}



}

