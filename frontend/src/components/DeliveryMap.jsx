import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import iconurl from "leaflet/dist/images/marker-icon.png";
import iconretinaurl from "leaflet/dist/images/marker-icon-2x.png";
import iconshadowurl from "leaflet/dist/images/marker-shadow.png";

// Fix Leaflet's default icon path issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconretinaurl,
  iconUrl: iconurl,
  shadowUrl: iconshadowurl,
});

export default function DeliveryMap({ location, orderNumber }) {
  if (!location) return null;
  const position = [location.lat, location.lng];

  return (
    <div style={{ height: "400px", width: "100%", borderRadius: "8px", overflow: "hidden", marginBottom: "1rem" }}>
      <MapContainer center={position} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={position}>
          <Popup>Current location of order: {orderNumber}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
