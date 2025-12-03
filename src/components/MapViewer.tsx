import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { ILOILO_LAT, ILOILO_LNG } from '../lib/constants';

// Fix for Leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewerProps {
    pickup?: { lat: number; lng: number };
    dropoff?: { lat: number; lng: number };
    runnerLocation?: { lat: number; lng: number };
}

export default function MapViewer({ pickup, dropoff, runnerLocation }: MapViewerProps) {
    // Determine center: runner > pickup > dropoff > default
    const centerLat = runnerLocation?.lat || pickup?.lat || dropoff?.lat || ILOILO_LAT;
    const centerLng = runnerLocation?.lng || pickup?.lng || dropoff?.lng || ILOILO_LNG;

    return (
        <div className="h-48 w-full rounded-lg overflow-hidden border border-gray-300 z-0">
             <MapContainer
                center={[centerLat, centerLng]}
                zoom={14}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {pickup && (
                    <Marker position={[pickup.lat, pickup.lng]}>
                        <Popup>Pickup Location</Popup>
                    </Marker>
                )}
                {dropoff && (
                    <Marker position={[dropoff.lat, dropoff.lng]}>
                         <Popup>Drop-off Location</Popup>
                    </Marker>
                )}
                {runnerLocation && (
                    <Marker position={[runnerLocation.lat, runnerLocation.lng]} opacity={0.8}>
                        <Popup>Runner</Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
}
