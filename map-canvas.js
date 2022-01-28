let mapObj = new ol.Map({
    target: 'mapDiv',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM()
        })
    ],
    view: new ol.View({
        center: ol.proj.fromLonLat([-113.933344, 52.871772]),
        zoom: 5.0
    })
});

let view = mapObj.getView();


let colorScaleDynamic = false;

let canv;
let mapLat;
let mapLon;
let targetLat;
let targetLon;
let d;
let rd;
let zoomLevel;
let coord;
let pixel;
let zoomingIn = false;
let zoomingOut = false;
let zoomFrameCount = 0;

let startCoord;
let endCoord;
let dragDX;
let dragDY;

let mapXCoord;
let mapYCoord;
let mapCoord = [];
let dZoom;

let headers = ["Field Number", "Year", "Site Accession", "Region", "County", "MDS Blk", "Incidence Blk",
    "DB Culture ID", "AvrLm_Genotype", "Species (Kcpn60 marker)", "Northing", "Easting", "locmult", "Legal Land Location"];


let year


let locations = new Map();
let line;
//let currentLoc = lines[0][12];
let currentLoc = "";
//console.log(currentLoc);
let locationMap = new Map();
//locationMap.set(currentLoc,[]);
//locations.set(currentLoc,ol.proj.fromLonLat([line[11], line[10]]))
let recordString;


let linesClone = [...lines];


function processLines() {

    locationMap = new Map();

    for (let i = 0; i < linesClone.length; i++) {
        line = linesClone[i];
        if (currentLoc === line[12]) {
            // same location
            recordString = line[13] + " " + line[1] + " " + line[9] + " (" + line[8] + ") " + " Incidence:" +
                line[6] + " MDS:" + line[5];
            locationMap.get(currentLoc).push(recordString);
        } else {
            // new location
            currentLoc = line[12];
            locationMap.set(currentLoc, []);
            recordString = line[13] + " " + line[1] + " " + line[9] + " (" + line[8] + ") " + " Incidence:" +
                line[6] + " MDS:" + line[5];
            locationMap.get(currentLoc).push(recordString);
            //locations.set(currentLoc,ol.proj.fromLonLat([line[11], line[10]]));
            locations.set(currentLoc, new Dot(line));
            //console.log(locations.get(currentLoc));
        }
    }

}



const years = _.keys(_.groupBy(lines, (d) => d[1])),
    counties = _.keys(_.groupBy(lines, (d) => d[4])),
    regions = _.keys(_.groupBy(lines, (d) => d[3]))
species = _.keys(_.groupBy(lines, (d) => d[9]));


function addOptions(key, values, dataIndex) {
    let selectHTML = document.getElementById(key);
    values.map((v) => {
        option = document.createElement('option');
        option.value = option.text = v;
        selectHTML.add(option);
    });

    selectHTML.addEventListener('change', function (event) {
        let val = event.target.value;
        if (val == 'All') {
            linesClone = [...lines];
        }
        else {
            linesClone = _.filter(lines, (d) => d[dataIndex] == val);
        }
        processLines();
        resetAllExcept(key);
    }, false);

}

function resetAllExcept(exceptKey) {
    let keys = ['year', 'county', 'region', 'species'];
    _.filter(keys, (d) => d != exceptKey).map((k) => {
        document.getElementById(k).value = 'All';
    });
}





function setup() {
    canv = createCanvas(800, 600);
    canv.parent('overlay');
    canv.mouseWheel(changeZoom);

    mapCoord = ol.proj.fromLonLat([-113.933344, 52.871772]);
    mapLat = 52.871772;
    mapLon = -113.933344;
    mapXCoord = mapCoord[0];
    mapYCoord = mapCoord[1];
    view.setCenter([mapXCoord, mapYCoord]);

    targetLat = 52.13614254361033;
    targetLon = -106.63083641094573;

    d = 5;
    zoomLevel = view.getZoom();

    processLines();

    addOptions('year', ['All', ...years], 1);
    addOptions('county', ['All', ...counties], 4);
    addOptions('region', ['All', ...regions], 3);
    addOptions('species', ['All', ...species], 9);

    document.getElementById('colorScale').addEventListener('change', function (event) {
        let val = event.target.value;


        if (val == 'default') {
            window.colorScaleDynamic = false;
        }
        else {
            window.colorScaleDynamic = true;
        }

    
    }, false);

}

function draw() {
    clear();

    if (zoomFrameCount < 20) {
        zoomFrameCount++;
        if (zoomingIn) {
            view.adjustZoom(0.05);
        }
        if (zoomingOut) {
            view.adjustZoom(-0.05);
        }
    } else {
        zoomingIn = false;
        zoomingOut = false;
    }
    zoomLevel = view.getZoom();

    // draw circle around Saskatoon
    //stroke(0, 200, 0);
    //noFill();
    noStroke();
    fill(0, 200, 0);
    coord = ol.proj.fromLonLat([targetLon, targetLat]);
    pixel = mapObj.getPixelFromCoordinate(coord);
    if (pixel != null) {
        rd = map(zoomLevel, 1.0, 10.0, d, d * 20);
        //ellipse(pixel[0], pixel[1], rd, rd);
    }

    // draw locations
    // for (let i = 0; i < locations.length; i++) {
    //     pixel = mapObj.getPixelFromCoordinate(locations[i]);
    //     if (pixel != null) {
    //         if (lines[i][9] === "biglobosa") {
    //             fill(0,0,200);
    //         }
    //         if (lines[i][9] === "maculans") {
    //             fill(200,0,0);
    //         }
    //         rd = map(zoomLevel, 1.0, 10.0, d, d * 2);
    //         //ellipse(pixel[0], pixel[1], rd, rd);
    //         ellipse(pixel[0], pixel[1], 4,4);
    //     }    
    // }
    fill(200, 0, 0);

    for (const locationKey of locationMap.keys()) {
        locations.get(locationKey).drawDot(colorScaleDynamic);
        //console.log(locationKey);
        //console.log(locations.get(locationKey));
        // pixel = mapObj.getPixelFromCoordinate(locations.get(locationKey));
        // if (pixel != null) {
        //     rd = map(zoomLevel, 1.0, 10.0, d, d * 2);
        //     //ellipse(pixel[0], pixel[1], rd, rd);
        //     ellipse(pixel[0], pixel[1], 4,4);
        // }    
    }
}

function mouseMoved() {
    //view.setZoom(map(constrain(mouseX, 0, width), 0, width, 1.2, 10.0));
    //zoomLevel = view.getZoom();
    //console.log(mouseX,mouseY);
    // for (const locationKey of locationMap.keys()) {
    //     if (locations.get(locationKey).checkHit(mouseX,mouseY)) {
    //         console.log(locationKey);
    //     }
    // }

}

function mousePressed() {
    startCoord = mapObj.getCoordinateFromPixel([mouseX, mouseY]);
    //console.log(startCoord);
}

function mouseDragged() {
    //mapLon -= movedX * 0.012 * 1;
    //mapLat += movedY * 0.008 * 1;
    startCoord = mapObj.getCoordinateFromPixel([pmouseX, pmouseY]);
    endCoord = mapObj.getCoordinateFromPixel([mouseX, mouseY]);
    //console.log("start: " + startCoord);
    //console.log("end: " + endCoord);
    dragDX = endCoord[0] - startCoord[0];
    dragDY = endCoord[1] - startCoord[1];
    //startCoord = endCoord;
    mapXCoord -= dragDX;
    mapYCoord -= dragDY;
    //console.log(dragDX,dragDY,mapXCoord,mapYCoord);
    //console.log(dragDX,dragDY);
    //view.setCenter(ol.proj.fromLonLat([mapLon, mapLat]));
    view.setCenter([mapXCoord, mapYCoord]);
    //startCoord = mapObj.getCoordinateFromPixel([mouseX,mouseY]);
}

function mouseClicked() {
    let found = null;
    for (const locationKey of locationMap.keys()) {
        if (locations.get(locationKey).checkHit(mouseX, mouseY)) {
            found = locationKey;
            break;
        }
    }
    if (found != null) {
        console.log(found);
        summary = "";
        records = locationMap.get(found);
        for (let i = 0; i < records.length; i++) {
            summary += records[i];
            summary += "<br>";
        }
        //console.log(summary);
        document.getElementById("details").innerHTML = summary;
    }

    //console.log(mouseX,mouseY);
    if (mouseX >= 10 && mouseX <= 33 && mouseY >= 10 && mouseY <= 33) {
        // zoom in
        //console.log("in");
        zoomingIn = true;
        zoomFrameCount = 0;
    }
    if (mouseX >= 10 && mouseX <= 33 && mouseY >= 34 && mouseY <= 55) {
        // zoom out
        if (zoomLevel > 4) {
            zoomingOut = true;
            zoomFrameCount = 0;
        }
    }
}

function changeZoom(event) {
    dZoom = event.deltaY * -1 / 150;
    //console.log(zoomLevel, dZoom);
    if (event.deltaY != null) {
        if (zoomLevel + dZoom > 4) {
            view.adjustZoom(dZoom);
        }
    }
}

// function keyTyped() {
//     console.log("current zoom: " + view.getZoom());
//     if (key == 'f') {
//         mapXCoord -= 10000;
//         view.setCenter([mapXCoord,mapYCoord]);
//     }
//     if (!zoomingIn && !zoomingOut) {
//         if (key == 'a') {
//             zoomingIn = true;
//         }
//         if (key == 'z') {
//             // min zoom seems to be 1.2288186904958809, so don't go past that
//             if (zoomLevel > 4) {
//                 zoomingOut = true;
//             }
//         }
//         zoomFrameCount = 0;
//     }
// }