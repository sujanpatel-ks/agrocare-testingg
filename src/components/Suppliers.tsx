import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingBag, Filter, Navigation, Star, Phone, MapPin, Loader2, LocateFixed, Compass, Info, Search, X, Clock, Mail, Globe, Calendar as CalendarIcon, ExternalLink } from 'lucide-react';
import { Supplier } from '../types';
import { SUPPLIERS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useGeolocation } from '../hooks/useGeolocation';
import { fetchOfficialShopName } from '../services/placesService';
import { toast } from 'sonner';

import { Language } from '../types';

class MapErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error?: Error}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    console.error("Map rendering error:", error);
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-red-50 text-center z-50">
          <div className="bg-white p-3 rounded-full mb-4 shadow-sm"><MapPin size={32} className="text-red-500" /></div>
          <h3 className="text-lg font-bold text-red-800 mb-2">Map Unavailable</h3>
          <p className="text-sm text-red-600 mb-4 max-w-xs">An error occurred while rendering the map. This might be due to a temporary network issue or invalid coordinates.</p>
          <button onClick={() => this.setState({ hasError: false })} className="px-6 py-2 bg-red-600 text-white rounded-full font-semibold shadow-sm hover:bg-red-700 transition">Retry Loading Map</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Fix for default marker icon
const markerIcon2x = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png';
const markerIcon = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
const markerShadow = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const supplierIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const selectedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface SuppliersProps {
  onBack: () => void;
  language: Language;
  initialSearch?: string;
}

// Component to handle map centering, bounds, and flying
const MapUpdater = ({ 
  selectedSupplier, 
  latitude, 
  longitude, 
  suppliers, 
  mapFlyTrigger, 
  fitBoundsTrigger,
  routeCoordinates 
}: { 
  selectedSupplier: Supplier | null, 
  latitude: number | null, 
  longitude: number | null, 
  suppliers: Supplier[], 
  mapFlyTrigger: number, 
  fitBoundsTrigger: number,
  routeCoordinates: [number, number][]
}) => {
  const map = useMap();
  const prevSupplierIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    // Prevent rendering glitches by forcing a resize check when map mounts
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (selectedSupplier && selectedSupplier.lat && selectedSupplier.lng && latitude && longitude) {
      const isNewSelection = prevSupplierIdRef.current !== selectedSupplier.id;
      const wasNull = prevSupplierIdRef.current === null;
      prevSupplierIdRef.current = selectedSupplier.id;

      if (wasNull) {
        // First automatic load selection: quietly position the map showing both without sudden double pans
        const bounds = L.latLngBounds([
          [latitude, longitude],
          [selectedSupplier.lat, selectedSupplier.lng]
        ]);
        if (routeCoordinates && routeCoordinates.length > 0) {
          routeCoordinates.forEach(coord => bounds.extend(coord));
        }
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
      } else if (isNewSelection) {
        // Stage 1: Fast & smooth fly to the selected supplier's pinpoint location to highlight it
        map.flyTo([selectedSupplier.lat, selectedSupplier.lng], 15, { 
          duration: 1.2,
          easeLinearity: 0.25
        });

        // Stage 2: After focusing on the supplier, pull back to frame the entire travel route and user location nicely
        const timer = setTimeout(() => {
          const bounds = L.latLngBounds([
            [latitude, longitude],
            [selectedSupplier.lat!, selectedSupplier.lng!]
          ]);

          if (routeCoordinates && routeCoordinates.length > 0) {
            routeCoordinates.forEach(coord => bounds.extend(coord));
          }

          map.flyToBounds(bounds, { 
            padding: [85, 85], 
            duration: 1.2,
            maxZoom: 15
          });
        }, 1300);

        return () => clearTimeout(timer);
      } else {
        // If selection is updated/re-selected, fit bounds normally
        const bounds = L.latLngBounds([
          [latitude, longitude],
          [selectedSupplier.lat, selectedSupplier.lng]
        ]);
        if (routeCoordinates && routeCoordinates.length > 0) {
          routeCoordinates.forEach(coord => bounds.extend(coord));
        }
        map.flyToBounds(bounds, { padding: [60, 60], duration: 1.0, maxZoom: 15 });
      }
    }
  }, [selectedSupplier, latitude, longitude, map, routeCoordinates]);

  useEffect(() => {
    if (fitBoundsTrigger > 0 && suppliers.length > 0 && latitude && longitude) {
      const bounds = L.latLngBounds(suppliers.map(s => [s.lat!, s.lng!]));
      bounds.extend([latitude, longitude]);
      map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
    }
  }, [fitBoundsTrigger, suppliers, latitude, longitude, map]);

  useEffect(() => {
    if (mapFlyTrigger > 0 && latitude && longitude) {
      map.flyTo([latitude, longitude], 13, { duration: 1.5 });
    }
  }, [mapFlyTrigger, latitude, longitude, map]);

  return null;
};

// Calculate distance between two coordinates in km 

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
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

export const Suppliers: React.FC<SuppliersProps> = ({ onBack, language, initialSearch }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const { latitude: geoLat, longitude: geoLng, loading: locationLoading, error: locationError, requestLocation } = useGeolocation();
  const [latitude, setLatitude] = useState<number>(15.3173); // Default Karnataka
  const [longitude, setLongitude] = useState<number>(75.7139);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [openingHours, setOpeningHours] = useState<string>('All');
  const [maxDistance, setMaxDistance] = useState<number>(50);
  const [minRating, setMinRating] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [expandedSupplier, setExpandedSupplier] = useState<Supplier | null>(null);
  const [isListExpanded, setIsListExpanded] = useState(false);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [mapFlyTrigger, setMapFlyTrigger] = useState(0);
  const [fitBoundsTrigger, setFitBoundsTrigger] = useState(0);
  const listRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({});
  const initialLocationRef = React.useRef<{lat: number, lng: number} | null>(null);

  const MOCK_HOURS = [
    { day: 'Monday', hours: '8:00 AM - 6:00 PM' },
    { day: 'Tuesday', hours: '8:00 AM - 6:00 PM' },
    { day: 'Wednesday', hours: '8:00 AM - 6:00 PM' },
    { day: 'Thursday', hours: '8:00 AM - 6:00 PM' },
    { day: 'Friday', hours: '8:00 AM - 8:00 PM' },
    { day: 'Saturday', hours: '9:00 AM - 4:00 PM' },
    { day: 'Sunday', hours: 'Closed' },
  ];

  useEffect(() => {
    if (selectedSupplier && listRefs.current[selectedSupplier.id]) {
      listRefs.current[selectedSupplier.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedSupplier]);

  useEffect(() => {
    if (geoLat && geoLng) {
      setLatitude(geoLat);
      setLongitude(geoLng);
      setError(null);
      setIsFallback(false);
      setMapFlyTrigger(prev => prev + 1); // Automatically fly to location when successfully fetched
    }
  }, [geoLat, geoLng]);

  useEffect(() => {
    if (locationError) {
      // If geolocation fails, we'll provide a fallback to Bangalore, India
      console.warn("Geolocation failed:", locationError);
      setLatitude(15.3173);
      setLongitude(75.7139);
      setError("Geolocation restricted in preview. Using default location (Karnataka).");
      setIsFallback(true);
    }
  }, [locationError]);

  useEffect(() => {
    if (latitude && longitude) {
      if (!initialLocationRef.current) {
        initialLocationRef.current = { lat: latitude, lng: longitude };
      }
      
      // Simulate network request and process SUPPLIERS data
      setLoading(true);
      const timerId = setTimeout(() => {
        try {
          let results = SUPPLIERS.map((s, i) => {
            // Generate deterministic mock coordinates around current user location
            // We use the index 'i' to create a pseudo-random but consistent offset
            const pseudoRandom1 = Math.sin(i * 12.9898) * 43758.5453;
            const pseudoRandom2 = Math.cos(i * 78.233) * 43758.5453;
            const offsetLat = (pseudoRandom1 - Math.floor(pseudoRandom1) - 0.5) * 0.05;
            const offsetLng = (pseudoRandom2 - Math.floor(pseudoRandom2) - 0.5) * 0.05;
            
            const lat = s.lat || latitude + offsetLat;
            const lng = s.lng || longitude + offsetLng;
            const actualDistance = getDistanceKm(latitude, longitude, lat, lng).toFixed(1);
            return { ...s, lat, lng, distance: `${actualDistance}` };
          });

          // Apply filters
          let filtered = [...results];

          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(s => 
              s.name.toLowerCase().includes(query) || 
              (s.tags && s.tags.some(tag => tag.toLowerCase().includes(query))) ||
              (s.address && s.address.toLowerCase().includes(query))
            );
          }

          if (selectedTag) {
            filtered = filtered.filter(s => s.tags && s.tags.includes(selectedTag));
          }
          
          // Dynamic mock injection for realistic UX when querying unknown items
          if (filtered.length === 0 && results.length > 0 && (searchQuery || selectedTag)) {
            const matchedToken = selectedTag || searchQuery;
            if (matchedToken) {
              results[0] = { ...results[0], tags: [matchedToken, ...(results[0].tags || [])] };
              filtered = [results[0]];
            }
          }

          if (openingHours !== 'All') {
            filtered = filtered.filter(s => s.status === openingHours);
          }
          
          filtered = filtered.filter(s => {
            const dist = parseFloat(s.distance as string);
            return !isNaN(dist) && dist <= maxDistance;
          });

          filtered = filtered.filter(s => s.rating >= minRating);

          setSuppliers(filtered);
          if (filtered.length > 0 && !selectedSupplier) {
            setSelectedSupplier(filtered[0]);
          } else if (filtered.length === 0) {
            setSelectedSupplier(null);
          }
        } catch (err) {
          console.error("Error processing suppliers:", err);
        } finally {
          setLoading(false);
        }
      }, 500);

      return () => clearTimeout(timerId);
    }
  }, [latitude, longitude, locationError, selectedTag, openingHours, maxDistance, minRating, searchQuery]);

  useEffect(() => {
    const fetchRoute = async () => {
      if (latitude && longitude && selectedSupplier?.lat && selectedSupplier?.lng) {
        try {
          const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${longitude},${latitude};${selectedSupplier.lng},${selectedSupplier.lat}?overview=full&geometries=geojson`
          );
          const data = await response.json();
          if (data.routes && data.routes[0]) {
            const coords = data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
            setRouteCoordinates(coords);
          } else {
            // Fallback to direct line if routing fails (API returned no route)
            setRouteCoordinates([
              [latitude, longitude],
              [selectedSupplier.lat, selectedSupplier.lng]
            ]);
          }
        } catch (error) {
          // Graceful fallback to direct line if the public routing API fails (e.g., rate limits, CORS)
          setRouteCoordinates([
            [latitude, longitude],
            [selectedSupplier.lat, selectedSupplier.lng]
          ]);
        }
      } else {
        setRouteCoordinates([]);
      }
    };

    fetchRoute();
  }, [latitude, longitude, selectedSupplier]);

  const handleVerifyName = async (supplier: Supplier) => {
    setVerifyingId(supplier.id);
    try {
      const result = await fetchOfficialShopName(supplier.name, 'store');
      const officialName = result.officialName;
      
      const origName = supplier.originalName || supplier.name;
      const differed = officialName.trim().toLowerCase() !== origName.trim().toLowerCase();

      setSuppliers(prev => prev.map(s => {
        if (s.id === supplier.id) {
          const updatedSupplier = {
            ...s,
            name: officialName,
            nameVerified: true,
            originalName: origName,
            officialNameDiffered: differed
          };
          // Sync state if currently selected or expanded
          if (selectedSupplier && selectedSupplier.id === s.id) {
            setSelectedSupplier(updatedSupplier);
          }
          if (expandedSupplier && expandedSupplier.id === s.id) {
            setExpandedSupplier(updatedSupplier);
          }
          return updatedSupplier;
        }
        return s;
      }));

      if (differed) {
        toast.success(
          language === 'hi' 
            ? `आधिकारिक नाम अपडेट किया गया: ${officialName}` 
            : language === 'kn' 
              ? `ಅಧಿಕೃತ ಹೆಸರು ನವೀಕರಿಸಲಾಗಿದೆ: ${officialName}` 
              : `Updated to official name: ${officialName}`
        );
      } else {
        toast.info(
          language === 'hi' 
            ? "नाम पहले से ही आधिकारिक है।" 
            : language === 'kn' 
              ? "ಹೆಸರು ಈಗಾಗಲೇ ಅಧಿಕೃತವಾಗಿದೆ." 
              : "Name is already official."
        );
      }
    } catch (err) {
      toast.error(
        language === 'hi' 
          ? "आधिकारिक नाम सत्यापित करने में विफल।" 
          : language === 'kn' 
            ? "ಅಧಿಕೃತ ಹೆಸರನ್ನು ಪರಿಶೀಲಿಸುವಲ್ಲಿ ವಿಫಲವಾಗಿದೆ." 
            : "Failed to verify official name."
      );
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div id="supplier-map" className="flex flex-col bg-[#F8F9FA] h-[100dvh] w-full relative z-40 overflow-hidden">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shrink-0 z-50 shadow-sm pt-8 md:pt-6">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full active:bg-gray-100 text-gray-600">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-black text-earth tracking-tight">
          {language === 'hi' ? 'आस-पास के आपूर्तिकर्ता' : language === 'kn' ? 'ಹತ್ತಿರದ ಸರಬರಾಜುದಾರರು' : 'Nearby Suppliers'}
        </h1>
        <button className="p-2 -mr-2 rounded-full active:bg-gray-100 text-gray-600 relative">
          <ShoppingBag size={24} />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
      </header>

      <div className="bg-white px-4 py-3 border-b border-gray-100 shrink-0 z-40">
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input 
            type="text"
            className="block w-full pl-10 pr-10 py-3 bg-gray-50 border-none rounded-2xl text-earth placeholder-gray-400 focus:ring-2 focus:ring-[#1B5E20] focus:outline-none shadow-inner" 
            placeholder="Search products (e.g. Mancozeb)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-earth"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="flex overflow-x-auto whitespace-nowrap hide-scrollbar space-x-3 pb-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-full font-bold shadow-sm active:scale-95 transition-all ${showFilters ? 'bg-[#1B5E20] text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            <Filter size={18} />
            <span>Filters</span>
          </button>
          <button 
            onClick={() => setOpeningHours(openingHours === 'open' ? 'All' : 'open')}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-full font-bold border transition-all ${
              openingHours === 'open' ? 'bg-[#E8F5E9] text-[#1B5E20] border-[#A5D6A7]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            <Clock size={16} />
            <span>Open Now</span>
          </button>
          {['Mancozeb', 'Organic', 'General Seeds', 'Tools'].map((tag, i) => (
            <button 
              key={i} 
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-6 py-2.5 rounded-full font-bold border transition-all ${
                selectedTag === tag ? 'bg-[#E8F5E9] text-[#1B5E20] border-[#A5D6A7]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 pb-2 space-y-4 border-t border-gray-100 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Specialty</label>
                    <select 
                      value={selectedTag || 'All'}
                      onChange={(e) => setSelectedTag(e.target.value === 'All' ? null : e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#1B5E20] focus:border-transparent"
                    >
                      <option value="All">All Specialties</option>
                      <option value="Mancozeb">Mancozeb</option>
                      <option value="Organic">Organic</option>
                      <option value="General Seeds">General Seeds</option>
                      <option value="Tools">Tools</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Opening Hours</label>
                    <select 
                      value={openingHours}
                      onChange={(e) => setOpeningHours(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#1B5E20] focus:border-transparent"
                    >
                      <option value="All">Any Time</option>
                      <option value="open">Open Now</option>
                      <option value="closing">Closing Soon</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">Max Distance: {maxDistance} km</label>
                  <input 
                    type="range" 
                    min="1" 
                    max="50" 
                    value={maxDistance} 
                    onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                    className="w-full accent-[#1B5E20]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">Min Rating: {minRating} Stars</label>
                  <input 
                    type="range" 
                    min="0" 
                    max="5" 
                    step="0.5"
                    value={minRating} 
                    onChange={(e) => setMinRating(parseFloat(e.target.value))}
                    className="w-full accent-[#1B5E20]"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <main className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden relative">
        {/* Map Visualization */}
        <motion.div 
          id="map-container"
          animate={{ height: isListExpanded ? '20vh' : '45vh' }}
          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
          className="md:!h-full md:!w-1/2 lg:!w-3/5 shrink-0 w-full min-h-[400px] bg-gray-200 relative z-10"
        >
          <MapErrorBoundary>
          {latitude && longitude ? (
            <MapContainer 
              center={[latitude, longitude]} 
              zoom={13} 
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <MapUpdater
                selectedSupplier={selectedSupplier}
                latitude={latitude}
                longitude={longitude}
                suppliers={suppliers}
                mapFlyTrigger={mapFlyTrigger}
                fitBoundsTrigger={fitBoundsTrigger}
                routeCoordinates={routeCoordinates}
              />
              
              <Marker position={[latitude, longitude]} icon={userIcon}>
                <Popup>You are here</Popup>
              </Marker>

              {suppliers.map((supplier) => (
                <Marker 
                  key={supplier.id} 
                  position={[supplier.lat!, supplier.lng!]} 
                  icon={selectedSupplier?.id === supplier.id ? selectedIcon : supplierIcon}
                  eventHandlers={{
                    click: () => {
                      setSelectedSupplier(supplier);
                    },
                  }}
                >
                  <Tooltip direction="top" offset={[0, -40]} className="bg-white border-none shadow-lg font-bold text-xs px-2 py-1 rounded-md text-earth">
                    {supplier.name} <span className="text-yellow-500">★ {supplier.rating}</span>
                  </Tooltip>
                  <Popup>
                    <div className="font-bold">{supplier.name}</div>
                    <div className="text-xs text-gray-500">{supplier.distance} km away</div>
                  </Popup>
                </Marker>
              ))}

              {routeCoordinates.length > 0 && (
                <>
                  {/* Outer glow/shadow */}
                  <Polyline 
                    positions={routeCoordinates} 
                    color="#1B5E20" 
                    weight={10}
                    opacity={0.25}
                    lineJoin="round"
                    lineCap="round"
                  />
                  {/* Main highway colored line */}
                  <Polyline 
                    positions={routeCoordinates} 
                    color="#2E7D32" 
                    weight={6}
                    opacity={0.85}
                    lineJoin="round"
                    lineCap="round"
                  />
                  {/* Moving dash tracker indicator */}
                  <Polyline 
                    positions={routeCoordinates} 
                    color="#E8F5E9" 
                    weight={3}
                    opacity={0.9}
                    lineJoin="round"
                    lineCap="round"
                    dashArray="8, 12"
                  />
                </>
              )}
            </MapContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          )}
          </MapErrorBoundary>
          
          <div className="absolute top-4 right-4 flex flex-col gap-3 z-[1000]">
            <button 
              onClick={() => {
                requestLocation();
                setSelectedSupplier(null);
                setMapFlyTrigger(prev => prev + 1);
              }}
              title="Locate Me"
              className="bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 text-[#1B5E20] active:scale-95 transition-all relative"
            >
              <LocateFixed size={24} className={locationLoading ? 'animate-pulse' : ''} />
              {isFallback && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />}
            </button>
            <button 
              onClick={() => setFitBoundsTrigger(prev => prev + 1)}
              title="Show all suppliers"
              className="bg-[#1B5E20] p-4 rounded-2xl shadow-2xl border border-white/20 text-white active:scale-95 transition-all"
            >
              <Compass size={24} />
            </button>
          </div>
        </motion.div>

        {/* List Section */}
        <div className="flex-1 md:w-1/2 lg:w-2/5 bg-white rounded-t-[32px] md:rounded-none md:rounded-l-[32px] shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.3)] md:shadow-[-8px_0_30px_-15px_rgba(0,0,0,0.3)] z-20 -mt-6 md:mt-0 flex flex-col min-h-0 relative">
          <div 
            className="w-full flex justify-center pt-4 pb-2 shrink-0 bg-white rounded-t-[32px] md:hidden z-50 cursor-pointer active:bg-gray-50 transition-colors" 
            style={{ touchAction: 'none' }}
            onClick={() => setIsListExpanded(!isListExpanded)}
          >
            <div className={`w-16 h-1.5 bg-gray-200 rounded-full transition-transform duration-300 ${isListExpanded ? 'scale-y-150 bg-[#1B5E20]' : ''}`}></div>
          </div>
          
          <div className="px-6 py-4 md:py-8 flex-1 overflow-y-auto overscroll-contain scroll-smooth pb-32 hide-scrollbar" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3 py-2">
              <h2 className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">
                {loading ? 'Searching...' : `${suppliers.length} Suppliers Found`}
              </h2>
              <span className="text-[10px] sm:text-xs font-black text-[#1B5E20] bg-[#E8F5E9] px-3 sm:px-4 py-1.5 rounded-full shadow-sm shrink-0 whitespace-nowrap">25km Radius</span>
            </div>
            
            {isFallback && !locationLoading && (
              <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 shadow-sm">
                <Info className="text-amber-600 shrink-0 mt-0.5 sm:mt-0" size={18} />
                <div className="flex-1">
                  <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    {error || 'Location access is required to show nearby suppliers accurately.'}
                  </p>
                </div>
                <button 
                  onClick={() => requestLocation()}
                  className="w-full sm:w-auto mt-2 sm:mt-0 px-4 py-2 bg-amber-600 text-white font-bold rounded-xl shadow-sm text-xs whitespace-nowrap active:scale-95 transition-transform"
                >
                  Locate Me
                </button>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-green-50 rounded-full animate-ping absolute opacity-20"></div>
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center relative">
                    <Loader2 className="text-[#1B5E20] animate-spin" size={40} />
                  </div>
                </div>
                <p className="text-earth font-black text-lg">Locating nearby stores...</p>
                <p className="text-gray-400 text-sm mt-1 font-medium">Using real-time GPS precision</p>
              </div>
            ) : error && !isFallback ? (
              <div className="bg-red-50 p-8 rounded-[32px] text-center border border-red-100 shadow-inner">
                <p className="text-red-600 font-bold text-lg">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 px-6 py-2 bg-red-100 text-red-700 rounded-full text-sm font-black hover:bg-red-200 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {suppliers.map((supplier, index) => (
                  <motion.div 
                    key={supplier.id}
                    ref={el => { if (el) listRefs.current[supplier.id] = el; }}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-20px" }}
                    whileHover={{ 
                      y: -8, 
                      scale: 1.015,
                      rotateX: 1.5,
                      rotateY: -1.5,
                      transition: { duration: 0.2, ease: "easeOut" }
                    }}
                    style={{ transformStyle: "preserve-3d", perspective: 1000 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20, delay: Math.min(index * 0.05, 0.3) }}
                    onClick={() => {
                      setSelectedSupplier(supplier);
                    }}
                    className={`official-card-target rounded-[40px] p-8 shadow-sm border transition-all cursor-pointer relative z-30 ${
                      selectedSupplier?.id === supplier.id 
                        ? 'bg-white border-[#1B5E20] shadow-2xl ring-8 ring-[#1B5E20]/5' 
                        : 'bg-white border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex flex-col">
                      <div className="flex justify-between items-start mb-8">
                        <div className="flex-1 pr-4">
                          <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium group cursor-pointer" onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSupplier(supplier);
                                toast.info(`Showing directions to ${supplier.address}`);
                              }}>
                                <MapPin size={16} className="text-[#1B5E20]" />
                                <span className="underline decoration-dotted transition-colors hover:text-[#1B5E20]">{supplier.address || "Main Street, Agri Hub"}</span>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="text-2xl font-black text-earth tracking-tight leading-tight">{supplier.name}</h3>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVerifyName(supplier);
                                }}
                                disabled={verifyingId === supplier.id}
                                className="group relative"
                                title="Fetch official Google Maps name"
                              >
                                {verifyingId === supplier.id ? (
                                  <Loader2 size={16} className="animate-spin text-primary" />
                                ) : (
                                  <div className={`p-1.5 rounded-lg transition-all shadow-sm ${
                                    supplier.nameVerified 
                                      ? 'bg-green-100 text-green-700 border border-green-200' 
                                      : 'bg-gray-50 text-gray-400 group-hover:text-primary group-hover:bg-primary/5 hover:scale-105'
                                  }`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                                  </div>
                                )}
                              </button>

                              {supplier.officialNameDiffered && (
                                <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full font-black uppercase tracking-wider flex items-center gap-1 shadow-sm shrink-0 animate-fade-in animate-duration-300">
                                  ⚠️ Name Adjusted
                                </span>
                              )}
                            </div>
                            {supplier.officialNameDiffered && supplier.originalName && (
                              <p className="text-[11px] text-gray-400 font-bold -mt-2 animate-fade-in">
                                {language === 'hi' ? 'मूल नाम:' : language === 'kn' ? 'ಮೂಲ ಹೆಸರು:' : 'Original:'} <span className="font-medium line-through">{supplier.originalName}</span>
                              </p>
                            )}
                            <div className="flex items-center text-sm text-gray-500 font-bold gap-4">
                              <div className="flex items-center">
                                <MapPin size={18} className="mr-1 text-[#1B5E20]" />
                                <span>{supplier.distance} km</span>
                              </div>
                              <div className="flex items-center text-[#1B5E20] bg-[#E8F5E9] px-2 py-0.5 rounded-md">
                                <Clock size={14} className="mr-1" />
                                <span>ETA: {Math.round(parseFloat(supplier.distance) * 1.5)} min</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${
                                  supplier.status === 'open' ? 'bg-green-500' : 
                                  supplier.status === 'closing' ? 'bg-orange-500' : 'bg-gray-400'
                                }`}></div>
                                <span className={supplier.status === 'open' ? 'text-green-600' : 'text-gray-500'}>
                                  {supplier.status === 'open' ? 'Open Now' : 
                                   supplier.status === 'closing' ? 'Closing Soon' : 'Closed'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-4">
                          {supplier.verified && (
                            <span className="bg-[#E8F5E9] text-[#1B5E20] text-[10px] font-black px-3 py-1.5 rounded-xl border border-[#A5D6A7] uppercase tracking-widest shadow-sm">Verified</span>
                          )}
                          <div className="flex flex-col items-end">
                            <div className="flex items-center text-yellow-500 bg-yellow-50 px-3 py-2 rounded-2xl shadow-sm border border-yellow-100">
                              <Star size={18} fill="currentColor" />
                              <span className="font-black text-earth ml-2 text-base">{supplier.rating}</span>
                            </div>
                            <span className="text-[11px] font-bold text-gray-400 mt-2 tracking-tight">({supplier.reviews} reviews)</span>
                          </div>
                        </div>
                      </div>
                      
                      {trackingId === supplier.id ? (
                        <div className="mt-4 mb-2 bg-[#F8F9FA] rounded-2xl p-4 border border-gray-100 relative overflow-hidden">
                          <div className="flex items-center justify-between mb-3 relative z-10">
                            <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Live Tracking</span>
                            <span className="text-xs font-bold text-[#1B5E20]">Arriving in {Math.round(parseFloat(supplier.distance) * 1.5)} min</span>
                          </div>
                          {/* Progress steps */}
                          <div className="relative flex items-center justify-between mb-2">
                            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-200 rounded-full"></div>
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#1B5E20] rounded-full w-[60%] animate-pulse"></div>
                            
                            <div className="relative z-10 w-6 h-6 rounded-full bg-[#1B5E20] text-white flex items-center justify-center shadow-lg border-2 border-white">
                              <ShoppingBag size={10} />
                            </div>
                            <div className="relative z-10 w-6 h-6 rounded-full bg-[#1B5E20] text-white flex items-center justify-center shadow-lg border-2 border-white">
                              <Navigation size={10} />
                            </div>
                            <div className="relative z-10 w-6 h-6 rounded-full bg-gray-200 border-2 border-white"></div>
                          </div>
                          <div className="flex justify-between text-[10px] font-bold text-gray-400 px-1 relative z-10">
                            <span>Packed</span>
                            <span className="text-[#1B5E20]">On the way</span>
                            <span>Delivered</span>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setTrackingId(null);
                            }}
                            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 bg-white rounded-full z-20"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-4 mt-6">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setTrackingId(supplier.id);
                              toast.info(`Started live tracking for ${supplier.name}`);
                            }}
                            className="flex-1 bg-[#1B5E20] hover:bg-[#144317] text-white text-base font-black py-4.5 rounded-[24px] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-sm"
                          >
                            <Compass size={20} />
                            Track Order
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`tel:${supplier.phone}`);
                            }}
                            className="flex-1 bg-white border-2 border-[#1B5E20] text-[#1B5E20] text-base font-black py-4.5 rounded-[24px] hover:bg-green-50 transition-all active:scale-95 flex items-center justify-center gap-3"
                          >
                            <Phone size={20} />
                            Call
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Expanded Supplier Modal */}
      <AnimatePresence>
        {expandedSupplier && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[2000] bg-white flex flex-col md:p-6 md:bg-black/50"
          >
            <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col bg-white md:rounded-[40px] overflow-hidden relative shadow-2xl">
              {/* Top Map Section */}
              <div className="h-[35%] shrink-0 relative bg-gray-200">
                <MapContainer 
                  center={[expandedSupplier.lat || 12.9716, expandedSupplier.lng || 77.5946]} 
                  zoom={16} 
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[expandedSupplier.lat || 12.9716, expandedSupplier.lng || 77.5946]} icon={selectedIcon}>
                    <Tooltip direction="top" offset={[0, -40]} className="bg-white border-none shadow-lg font-bold text-xs px-2 py-1 rounded-md text-earth">
                      {expandedSupplier.name} <span className="text-yellow-500">★ {expandedSupplier.rating}</span>
                    </Tooltip>
                  </Marker>
                  {latitude && longitude && (
                    <Marker position={[latitude, longitude]} icon={userIcon} />
                  )}
                  {routeCoordinates.length > 0 && (
                    <>
                      {/* Outer glow/shadow */}
                      <Polyline 
                        positions={routeCoordinates} 
                        color="#1B5E20" 
                        weight={10}
                        opacity={0.25}
                        lineJoin="round"
                        lineCap="round"
                      />
                      {/* Main highway colored line */}
                      <Polyline 
                        positions={routeCoordinates} 
                        color="#2E7D32" 
                        weight={6}
                        opacity={0.85}
                        lineJoin="round"
                        lineCap="round"
                      />
                      {/* Moving dash tracker indicator */}
                      <Polyline 
                        positions={routeCoordinates} 
                        color="#E8F5E9" 
                        weight={3}
                        opacity={0.9}
                        lineJoin="round"
                        lineCap="round"
                        dashArray="8, 12"
                      />
                    </>
                  )}
                </MapContainer>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedSupplier(null);
                  }}
                  className="absolute top-6 left-4 md:top-6 md:left-6 z-[3000] bg-white p-3 rounded-full shadow-lg text-gray-700 hover:text-earth hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft size={24} />
                </button>

                <div className="absolute bottom-6 right-4 z-[3000]">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const destination = expandedSupplier.lat && expandedSupplier.lng 
                        ? `${expandedSupplier.lat},${expandedSupplier.lng}`
                        : encodeURIComponent(expandedSupplier.name + ' ' + (expandedSupplier.address || ''));
                      window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
                    }}
                    className="bg-[#1B5E20] hover:bg-[#144317] text-white p-4 rounded-2xl shadow-xl transition-all flex items-center justify-center"
                  >
                    <Navigation size={24} />
                  </button>
                </div>
              </div>
              
              {/* Details Section */}
              <div className="flex-1 overflow-y-auto bg-white rounded-t-[32px] -mt-6 z-[3000] relative" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="w-full flex justify-center pt-4 pb-2 shrink-0 bg-white rounded-t-[32px] sticky top-0 md:hidden z-[3050]">
                  <div className="w-16 h-1.5 bg-gray-200 rounded-full"></div>
                </div>
                
                <div className="px-6 md:px-10 py-4 pb-24 w-full">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black text-earth tracking-tight leading-tight mb-2">{expandedSupplier.name}</h2>
                      {expandedSupplier.officialNameDiffered && (
                        <div className="flex flex-col gap-1 mb-3">
                          <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full font-black uppercase tracking-wider flex items-center gap-1 self-start shadow-sm shrink-0 animate-fade-in animate-duration-300">
                            ⚠️ Name Adjusted to Google Official
                          </span>
                          {expandedSupplier.originalName && (
                            <p className="text-xs text-gray-400 font-bold">
                              {language === 'hi' ? 'मूल नाम:' : language === 'kn' ? 'ಮೂಲ ಹೆಸರು:' : 'Original:'} <span className="font-medium line-through">{expandedSupplier.originalName}</span>
                            </p>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        {expandedSupplier.verified && (
                          <span className="bg-[#E8F5E9] text-[#1B5E20] text-[10px] font-black px-3 py-1.5 rounded-xl border border-[#A5D6A7] uppercase tracking-widest shadow-sm">Verified</span>
                        )}
                        <div className="flex items-center text-yellow-500 bg-yellow-50 px-2.5 py-1 rounded-xl shadow-sm border border-yellow-100">
                          <Star size={14} fill="currentColor" />
                          <span className="font-black text-earth ml-1.5 text-sm">{expandedSupplier.rating}</span>
                          <span className="text-[10px] font-bold text-gray-400 ml-1">({expandedSupplier.reviews})</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Contact & Location */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Contact & Location</h3>
                      <div className="bg-gray-50 rounded-2xl p-5 space-y-4 border border-gray-100">
                        <div className="flex items-start gap-3 text-gray-600">
                          <MapPin size={20} className="text-[#1B5E20] shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-earth text-sm">{expandedSupplier.address}</p>
                            <p className="text-xs text-gray-500 mt-1">{expandedSupplier.distance} km away from your location</p>
                          </div>
                        </div>
                        <div className="h-px bg-gray-200 w-full" />
                        <div className="flex items-center gap-3 text-gray-600">
                          <Phone size={20} className="text-[#1B5E20] shrink-0" />
                          <a href={`tel:${expandedSupplier.phone}`} className="font-bold text-earth text-sm hover:text-[#1B5E20] transition-colors">
                            {expandedSupplier.phone}
                          </a>
                        </div>
                        <div className="h-px bg-gray-200 w-full" />
                        <div className="flex items-center gap-3 text-gray-600">
                          <Mail size={20} className="text-[#1B5E20] shrink-0" />
                          <p className="font-bold text-earth text-sm">
                            contact@{expandedSupplier.name.replace(/\s+/g, '').toLowerCase()}.com
                          </p>
                        </div>
                        <div className="h-px bg-gray-200 w-full" />
                        <div className="flex items-center gap-3 text-gray-600">
                          <Globe size={20} className="text-[#1B5E20] shrink-0" />
                          <a href="#" className="font-bold text-[#1B5E20] text-sm hover:underline flex items-center gap-1">
                            www.{expandedSupplier.name.replace(/\s+/g, '').toLowerCase()}.com
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Opening Hours */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Opening Hours</h3>
                      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 h-full">
                        <div className="flex items-center gap-2 mb-4">
                          <div className={`w-2.5 h-2.5 rounded-full ${
                            expandedSupplier.status === 'open' ? 'bg-green-500 animate-pulse' : 
                            expandedSupplier.status === 'closing' ? 'bg-orange-500' : 'bg-gray-400'
                          }`}></div>
                          <span className={`text-sm font-black tracking-wide uppercase ${
                            expandedSupplier.status === 'open' ? 'text-green-600' : 
                            expandedSupplier.status === 'closing' ? 'text-orange-600' : 'text-gray-500'
                          }`}>
                            {expandedSupplier.status === 'open' ? 'Currently Open' : 
                             expandedSupplier.status === 'closing' ? 'Closing Soon' : 'Currently Closed'}
                          </span>
                        </div>
                        <ul className="space-y-3">
                          {MOCK_HOURS.map((schedule, idx) => (
                            <li key={idx} className="flex justify-between items-center text-sm">
                              <span className={`font-medium ${idx === new Date().getDay() - 1 || (idx === 6 && new Date().getDay() === 0) ? 'text-[#1B5E20] font-bold' : 'text-gray-500'}`}>
                                {schedule.day} {idx === new Date().getDay() - 1 || (idx === 6 && new Date().getDay() === 0) ? '(Today)' : ''}
                              </span>
                              <span className={`font-bold ${schedule.hours === 'Closed' ? 'text-red-500' : 'text-earth'}`}>
                                {schedule.hours}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-100">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`tel:${expandedSupplier.phone}`);
                      }}
                      className="flex-1 bg-[#1B5E20] hover:bg-[#144317] text-white text-base font-black py-4 md:py-5 rounded-[24px] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg shadow-green-900/20"
                    >
                      <Phone size={20} />
                      Call
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const destination = expandedSupplier.lat && expandedSupplier.lng 
                          ? `${expandedSupplier.lat},${expandedSupplier.lng}`
                          : encodeURIComponent(expandedSupplier.name + ' ' + (expandedSupplier.address || ''));
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
                      }}
                      className="flex-1 bg-white border-2 border-[#1B5E20] text-[#1B5E20] hover:bg-green-50 text-base font-black py-4 md:py-5 rounded-[24px] transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                      <Navigation size={20} />
                      Locate
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Placeholder for messaging or inventory check
                        toast.success("Opening chat with supplier...");
                      }}
                      className="flex-1 bg-white border-2 border-gray-200 text-earth hover:border-[#1B5E20] hover:text-[#1B5E20] text-base font-black py-4 md:py-5 rounded-[24px] transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                      <Mail size={20} />
                      Quote
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
