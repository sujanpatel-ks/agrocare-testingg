import { useState, useEffect, useRef } from 'react';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

// Calculate distance between two coordinates in meters
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function useGeolocation(thresholdMeters: number = 10) {
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
  });
  const lastLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false,
      }));
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;
      
      // Ignore updates with poor accuracy (e.g., > 100 meters) to prevent GPS jumping,
      // unless we don't have any location yet.
      if (lastLocationRef.current && accuracy > 100) {
        return;
      }

      // Only update if we don't have a previous location, or if the distance moved is greater than the threshold
      if (
        !lastLocationRef.current ||
        getDistance(
          lastLocationRef.current.latitude,
          lastLocationRef.current.longitude,
          latitude,
          longitude
        ) > thresholdMeters
      ) {
        lastLocationRef.current = { latitude, longitude };
        setLocation({
          latitude,
          longitude,
          error: null,
          loading: false,
        });
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      // Only set error if we don't have a location yet, to prevent 
      // temporary signal loss from clearing a known good location.
      if (!lastLocationRef.current) {
        setLocation((prev) => ({
          ...prev,
          error: error.message,
          loading: false,
        }));
      }
    };

    // Get initial position
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      maximumAge: 0, // Force fresh position
      timeout: 10000,
    });

    // Watch for real-time updates
    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      maximumAge: 0, // Force fresh position
      timeout: 10000,
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return location;
}
