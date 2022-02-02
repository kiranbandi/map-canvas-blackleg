class Dot {
    lon = 0;
    lat = 0;
    incidence = 0;
    mapPoint = [];
    pixel = [];
    records = [];
    x = 0;
    y = 0;
    r = 0;
    species = 0;

    constructor(line) {
        this.lon = line[11];
        this.lat = line[10];
        this.mapPoint = ol.proj.fromLonLat([line[11], line[10]]);
        this.incidence = line[6];
        this.species = line[9] == 'biglobosa' ? 0 : 1;
    }

    drawDot() {
        this.r = map(zoomLevel, 1.0, 10.0, 1.0, 15.0);
        this.pixel = mapObj.getPixelFromCoordinate(this.mapPoint);

        if(this.species==0){
            fill(200, 0, 0);
        }
        else {
            fill(0, 200, 0);
        }
       
        stroke(150);
        strokeWeight(0.5);
        if (this.pixel != null) {
            this.x = this.pixel[0];
            this.y = this.pixel[1];
            ellipse(this.x, this.y, this.r, this.r);
        }
    }

    checkHit(mx, my) {
        return this.dist(mx, my, this.x, this.y) <= this.r;
    }

    dist(x1, y1, x2, y2) {
        let dx = x2 - x1;
        let dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
}