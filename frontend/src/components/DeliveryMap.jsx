import { Component, useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

function formatCoordinate(value) {
  return typeof value === "number" ? value.toFixed(4) : "0.0000";
}

function DeliveryMapFallback({ location, orderNumber, message }) {
  return (
    <div
      className="card"
      style={{
        padding: "1.5rem",
        marginBottom: "1rem",
        borderStyle: "dashed",
        background: "var(--color-background)",
      }}
    >
      <div className="stack" style={{ gap: "0.5rem" }}>
        <strong style={{ color: "var(--color-text)" }}>Live delivery updates available</strong>
        <span style={{ color: "var(--color-muted)", lineHeight: 1.6 }}>
          {message || "The live map is temporarily unavailable, but delivery tracking is still active."}
        </span>
        <span style={{ color: "var(--color-text)", fontWeight: 700 }}>
          Order {orderNumber}: {formatCoordinate(location?.lat)}, {formatCoordinate(location?.lng)}
        </span>
      </div>
    </div>
  );
}

class DeliveryMapErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.orderNumber !== this.props.orderNumber && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <DeliveryMapFallback
          location={this.props.location}
          orderNumber={this.props.orderNumber}
        />
      );
    }

    return this.props.children;
  }
}

function DeliveryMapRenderer({ location, orderNumber }) {
  const [mapModules, setMapModules] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadMapModules() {
      try {
        const [{ MapContainer, Marker, Popup, TileLayer }, leafletModule] = await Promise.all([
          import("react-leaflet"),
          import("leaflet"),
        ]);

        const leaflet = leafletModule.default || leafletModule;

        delete leaflet.Icon.Default.prototype._getIconUrl;
        leaflet.Icon.Default.mergeOptions({
          iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
          iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
          shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href,
        });

        if (!cancelled) {
          setMapModules({ MapContainer, Marker, Popup, TileLayer });
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error?.message || "Unable to load the live delivery map right now.");
        }
      }
    }

    loadMapModules();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!location) {
    return null;
  }

  if (loadError) {
    return (
      <DeliveryMapFallback
        location={location}
        orderNumber={orderNumber}
        message={loadError}
      />
    );
  }

  if (!mapModules) {
    return (
      <DeliveryMapFallback
        location={location}
        orderNumber={orderNumber}
        message="Loading the live delivery map..."
      />
    );
  }

  const { MapContainer, Marker, Popup, TileLayer } = mapModules;
  const position = [location.lat, location.lng];
  const mapKey = `${orderNumber}-${position[0]}-${position[1]}`;

  return (
    <div
      style={{
        height: "400px",
        width: "100%",
        borderRadius: "8px",
        overflow: "hidden",
        marginBottom: "1rem",
      }}
    >
      <MapContainer key={mapKey} center={position} zoom={13} style={{ height: "100%", width: "100%" }}>
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

export default function DeliveryMap(props) {
  return (
    <DeliveryMapErrorBoundary {...props}>
      <DeliveryMapRenderer {...props} />
    </DeliveryMapErrorBoundary>
  );
}
