import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useState } from 'react';
import L from 'leaflet';
import { ILOILO_LAT, ILOILO_LNG } from '../lib/constants';

// Fix for Leaflet marker icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
    initialLat?: number;
    initialLng?: number;
    onLocationSelect: (lat: number, lng: number) => void;
}

function LocationMarker({ onSelect, position }: { onSelect: (lat: number, lng: number) => void, position: { lat: number, lng: number } | null }) {
    useMapEvents({
        click(e) {
            onSelect(e.latlng.lat, e.latlng.lng);
        },
    });

    return position ? <Marker position={[position.lat, position.lng]} /> : null;
}

export default function MapPicker({ initialLat, initialLng, onLocationSelect }: MapPickerProps) {
    const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
        initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
    );

    const handleSelect = (lat: number, lng: number) => {
        setPosition({ lat, lng });
        onLocationSelect(lat, lng);
    };

    return (
        <div className="h-48 w-full rounded-lg overflow-hidden border border-gray-300 relative z-0">
             <MapContainer
                center={[initialLat || ILOILO_LAT, initialLng || ILOILO_LNG]}
                zoom={15}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker onSelect={handleSelect} position={position} />
            </MapContainer>
            <div className="absolute bottom-2 right-2 bg-white px-2 py-1 text-xs rounded shadow z-[1000] opacity-80 pointer-events-none">
                Tap to select location
            </div>
        </div>
    );
}
