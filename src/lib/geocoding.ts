// Service to handle reverse geocoding
// Using OpenStreetMap Nominatim API (free, requires User-Agent)

export const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
            headers: {
                'User-Agent': 'RunnersApp/1.0 (student-project)'
            }
        });

        if (!response.ok) return null;

        const data = await response.json();

        // Construct a readable address
        // Nominatim returns structured address in data.address
        const addr = data.address;
        if (!addr) return data.display_name; // Fallback

        // Prioritize building/amenity name, then road, then city
        const parts = [];
        if (addr.amenity || addr.building || addr.shop || addr.tourism) {
            parts.push(addr.amenity || addr.building || addr.shop || addr.tourism);
        }
        if (addr.house_number) parts.push(addr.house_number);
        if (addr.road) parts.push(addr.road);
        // if (addr.suburb || addr.city_district) parts.push(addr.suburb || addr.city_district);

        return parts.length > 0 ? parts.join(', ') : data.display_name.split(',')[0];
    } catch (error) {
        console.error("Geocoding error:", error);
        return null;
    }
};
