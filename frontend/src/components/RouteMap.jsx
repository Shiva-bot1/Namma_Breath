import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./RouteMap.css";

// Bengaluru center, used as the default view before any stations are picked.
const BENGALURU_CENTER = [12.9716, 77.5946];

// Custom pin markers (colored SVG) instead of Leaflet's default blue pin,
// so Route A / Route B visually match the app's brand palette and the
// Exposure Ring colors used elsewhere in the Compare view.
function makePinIcon(color, label) {
  const svg = `
    <svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 0C7.6 0 0 7.6 0 17c0 12.4 17 27 17 27s17-14.6 17-27C34 7.6 26.4 0 17 0z" fill="${color}"/>
      <circle cx="17" cy="17" r="10" fill="white"/>
      <text x="17" y="22" font-size="13" font-weight="700" font-family="Arial, sans-serif" text-anchor="middle" fill="${color}">${label}</text>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: "route-map-pin",
    iconSize: [34, 44],
    iconAnchor: [17, 44],
    popupAnchor: [0, -40],
  });
}

const iconA = makePinIcon("#0B5D57", "A"); // teal, matches brand primary
const iconB = makePinIcon("#F4A300", "B"); // marigold, matches brand accent

// Adjusts the map view to fit both markers whenever the selected stations
// change, instead of leaving the view static or requiring the user to
// manually pan/zoom to see both corridors at once.
function FitToMarkers({ stationA, stationB }) {
  const map = useMap();

  useEffect(() => {
    if (!stationA || !stationB) return;
    const bounds = L.latLngBounds(
      [stationA.lat, stationA.lng],
      [stationB.lat, stationB.lng]
    );
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 13 });
  }, [map, stationA, stationB]);

  return null;
}

export default function RouteMap({ stationA, stationB }) {
  return (
    <div className="route-map-wrap">
      <MapContainer
        center={BENGALURU_CENTER}
        zoom={11}
        scrollWheelZoom={false}
        className="route-map-container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {stationA && (
          <Marker position={[stationA.lat, stationA.lng]} icon={iconA}>
            <Popup>
              <strong>Route A</strong>
              <br />
              {stationA.name}
            </Popup>
          </Marker>
        )}
        {stationB && (
          <Marker position={[stationB.lat, stationB.lng]} icon={iconB}>
            <Popup>
              <strong>Route B</strong>
              <br />
              {stationB.name}
            </Popup>
          </Marker>
        )}
        <FitToMarkers stationA={stationA} stationB={stationB} />
      </MapContainer>
    </div>
  );
}
