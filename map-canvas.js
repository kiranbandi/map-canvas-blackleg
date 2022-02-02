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


let locations = new Map();
let line;
let currentLoc = "";
let locationMap = new Map();
let recordString;

// Remap lines so that the virulent genes are in a sorted array for easier handling
lines = _.map(lines, (d) => {
    d[8] = d[8].split('-').sort((a, b) => (+b) - (+a));
    return d;
});

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
// To get a list of avirulent genes, first get all unique gene lists
// then flatten them into a single list and then pick the unique ones
const genes = _.filter(_.uniq(_.flatMap(_.keys(_.groupBy(lines,
    (d) => d[8]))
    .map((e) => e.split(',')))), (f) => f.length > 0);


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
            // For genes select filter a line if it contains the gene in its list
            if (event.target.id == 'genes') {
                linesClone = _.filter(lines, (d) => d[8].indexOf(val) > -1);
            }
            else {
                linesClone = _.filter(lines, (d) => d[dataIndex] == val);
            }
        }
        processLines();
        resetAllExcept(key);
    }, false);

}

function resetAllExcept(exceptKey) {
    let keys = ['years', 'county', 'region', 'species'];
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

    addOptions('years', ['All', ...years], 1);
    addOptions('county', ['All', ...counties], 4);
    addOptions('region', ['All', ...regions], 3);
    addOptions('species', ['All', ...species], 9);
    addOptions('genes', ['All', ...genes], 8);
    attachLocationClick(view);
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

    fill(200, 0, 0);

    for (const locationKey of locationMap.keys()) {
        locations.get(locationKey).drawDot();
    }
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


function attachLocationClick() {
    document.getElementById('center-map-button').addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                mapCoord = ol.proj.fromLonLat([pos.coords.longitude, pos.coords.latitude]);
                mapLat = 52.871772;
                mapLon = -113.933344;
                mapXCoord = mapCoord[0];
                mapYCoord = mapCoord[1];
                view.setCenter([mapCoord[0], mapCoord[1]]);
            });
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    });

    document.getElementById('reset-button').addEventListener('click',()=>{
        //reset filters
        resetAllExcept();
        // reset lines
        linesClone = [...lines];
        processLines();
        // reset map
        mapCoord = ol.proj.fromLonLat([-113.933344, 52.871772]);
        mapLat = 52.871772;
        mapLon = -113.933344;
        mapXCoord = mapCoord[0];
        mapYCoord = mapCoord[1];
        view.setCenter([mapCoord[0], mapCoord[1]]);
        view.setZoom(5);
        // reset details box 
        document.getElementById("details").innerHTML = 'Click on a circle to see details from that location...';
    });

    
}
