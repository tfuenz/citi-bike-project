let streetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

let newYorkCoords = [40.73, -74.0059];
let mapZoomLevel = 12;

let layers = {
    COMING_SOON: new L.LayerGroup(),
    EMPTY: new L.LayerGroup(),
    LOW: new L.LayerGroup(),
    NORMAL: new L.LayerGroup(),
    OUT_OF_ORDER: new L.LayerGroup()
};

let myMap = L.map("map-id", {
    center: newYorkCoords,
    zoom: mapZoomLevel,
    layers: [
        layers.COMING_SOON, 
        layers.EMPTY,
        layers.LOW,
        layers.NORMAL,
        layers.OUT_OF_ORDER
    ]
});

streetMap.addTo(myMap);

let overlays = {
    "Coming Soon": layers.COMING_SOON,
    "Empty Station": layers.EMPTY,
    "Low Stations": layers.LOW,
    "Healthy Stations": layers.NORMAL,
    "Out of Order": layers.OUT_OF_ORDER
};

L.control.layers(null, overlays).addTo(myMap);

let info = L.control({
  position: "bottomright"
});

info.onAdd = function() {
    let div = L.DomUtil.create("div", "legend");
    return div;
};

info.addTo(myMap);

let icons = {
  COMING_SOON: L.ExtraMarkers.icon({
    icon: "ion-settings",
    iconColor: "white",
    markerColor: "yellow",
    shape: "star"
  }),
  EMPTY: L.ExtraMarkers.icon({
    icon: "ion-android-bicycle",
    iconColor: "white",
    markerColor: "red",
    shape: "circle"
  }),
  OUT_OF_ORDER: L.ExtraMarkers.icon({
    icon: "ion-minus-circled",
    iconColor: "white",
    markerColor: "blue-dark",
    shape: "penta"
  }),
  LOW: L.ExtraMarkers.icon({
    icon: "ion-android-bicycle",
    iconColor: "white",
    markerColor: "orange",
    shape: "circle"
  }),
  NORMAL: L.ExtraMarkers.icon({
    icon: "ion-android-bicycle",
    iconColor: "white",
    markerColor: "green",
    shape: "circle"
  })
};

let queryUrl1 = "https://gbfs.citibikenyc.com/gbfs/en/station_information.json";
let queryUrl2 = "https://gbfs.citibikenyc.com/gbfs/en/station_status.json";

d3.json(queryUrl1).then(function(infoRes) {
  d3.json(queryUrl2).then(function(statusRes) {
    let updatedAt = infoRes.last_updated;
    let stationStatus = statusRes.data.stations;
    let stationInfo = infoRes.data.stations;

    let stationCount = {
      COMING_SOON: 0,
      EMPTY: 0,
      LOW: 0,
      NORMAL: 0,
      OUT_OF_ORDER: 0
    };

    let stationStatusCode;

    for (let i = 0; i < stationInfo.length; i++) {
      
      let station = Object.assign({}, stationInfo[i], stationStatus[i]);
      
      if (!station.is_installed) {
        stationStatusCode = "COMING_SOON";
      }
      
      else if (!station.num_bikes_available) {
        stationStatusCode = "EMPTY"
      }
      
      else if (station.is_installed && !station.is_renting) {
        stationStatusCode = "OUT_OF_ORDER";
      }
      
      else if (station.num_bikes_available < 5) {
        stationStatusCode = "LOW";
      }

      else {
        stationStatusCode = "NORMAL";
      }

      stationCount[stationStatusCode]++;
      let newMarker = L.marker([station.lat, station.lon], {
        icon: icons[stationStatusCode]
      });

      newMarker.addTo(layers[stationStatusCode]);
      newMarker.bindPopup(station.name + "<br> Capacity: " + station.capacity + "<br>" + station.num_bikes_available + " Bikes Available");
    }

    updateLegend(updatedAt, stationCount);
  });
});

function updateLegend(time, stationCount) {
  document.querySelector(".legend").innerHTML = [
    "<p>Updated: " + moment.unix(time).format("h:mm:ss A") + "</p>",
    "<p class='out-of-order'>Out of Order Stations: " + stationCount.OUT_OF_ORDER + "</p>",
    "<p class='coming-soon'>Stations Coming Soon: " + stationCount.COMING_SOON + "</p>",
    "<p class='empty'>Empty Stations: " + stationCount.EMPTY + "</p>",
    "<p class='low'>Low Stations: " + stationCount.LOW + "</p>",
    "<p class='healthy'>Healthy Stations: " + stationCount.NORMAL + "</p>"
  ].join("");
}