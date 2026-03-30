import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingBag, Filter, Navigation, Star, Phone, MapPin, Loader2, LocateFixed, Compass } from 'lucide-react';
import { Supplier } from '../types';
import { SUPPLIERS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { useGeolocation } from '../hooks/useGeolocation';

import { Language } from '../types';

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
}

// Component to handle map centering
const ChangeView = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
};

export const Suppliers: React.FC<SuppliersProps> = ({ onBack, language }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const { latitude, longitude, loading: locationLoading, error: locationError } = useGeolocation();
  const [error, setError] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [openingHours, setOpeningHours] = useState<string>('All');
  const [maxDistance, setMaxDistance] = useState<number>(10);
  const [minRating, setMinRating] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);
  const listRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({});
  const initialLocationRef = React.useRef<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (selectedSupplier && listRefs.current[selectedSupplier.id]) {
      listRefs.current[selectedSupplier.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedSupplier]);

  useEffect(() => {
    if (locationError) {
      setError(locationError);
      setLoading(false);
      return;
    }

    if (latitude && longitude) {
      if (!initialLocationRef.current) {
        initialLocationRef.current = { lat: latitude, lng: longitude };
      }
      
      // Simulate network request and process SUPPLIERS data
      setLoading(true);
      setTimeout(() => {
        let results = SUPPLIERS.map((s, i) => {
          // Generate deterministic mock coordinates around initial user location
          // We use the index 'i' to create a pseudo-random but consistent offset
          const pseudoRandom1 = Math.sin(i * 12.9898) * 43758.5453;
          const pseudoRandom2 = Math.cos(i * 78.233) * 43758.5453;
          const offsetLat = (pseudoRandom1 - Math.floor(pseudoRandom1) - 0.5) * 0.05;
          const offsetLng = (pseudoRandom2 - Math.floor(pseudoRandom2) - 0.5) * 0.05;
          
          const lat = s.lat || initialLocationRef.current!.lat + offsetLat;
          const lng = s.lng || initialLocationRef.current!.lng + offsetLng;
          return { ...s, lat, lng };
        });

        // Apply filters
        if (selectedTag) {
          results = results.filter(s => s.tags.includes(selectedTag));
        }
        
        if (openingHours !== 'All') {
          results = results.filter(s => s.status === openingHours);
        }
        
        results = results.filter(s => {
          const dist = parseFloat(s.distance);
          return !isNaN(dist) && dist <= maxDistance;
        });

        results = results.filter(s => s.rating >= minRating);

        setSuppliers(results);
        if (results.length > 0 && !selectedSupplier) {
          setSelectedSupplier(results[0]);
        } else if (results.length === 0) {
          setSelectedSupplier(null);
        }
        setLoading(false);
      }, 500);
    }
  }, [latitude, longitude, locationError, selectedTag, openingHours, maxDistance, minRating]);

  return (
    <div className="absolute inset-0 flex flex-col bg-[#F8F9FA]">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shrink-0 z-50 shadow-sm">
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
        <div className="flex overflow-x-auto whitespace-nowrap hide-scrollbar space-x-3 pb-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-full font-bold shadow-sm active:scale-95 transition-all ${showFilters ? 'bg-[#1B5E20] text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            <Filter size={18} />
            <span>Filters</span>
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

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Map Visualization */}
        <div className="relative h-[35vh] w-full bg-gray-200 shrink-0 z-10">
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
              <ChangeView 
                center={selectedSupplier && selectedSupplier.lat && selectedSupplier.lng 
                  ? [selectedSupplier.lat, selectedSupplier.lng] 
                  : [latitude, longitude]} 
                zoom={selectedSupplier ? 15 : 13} 
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
                    click: () => setSelectedSupplier(supplier),
                  }}
                >
                  <Tooltip permanent direction="top" offset={[0, -40]} className="bg-white border-none shadow-lg font-black text-[10px] px-2 py-1 rounded-md text-earth">
                    {supplier.name}
                  </Tooltip>
                  <Popup>
                    <div className="font-bold">{supplier.name}</div>
                    <div className="text-xs text-gray-500">{supplier.distance} km away</div>
                  </Popup>
                </Marker>
              ))}

              {selectedSupplier && latitude && longitude && (
                <Polyline 
                  positions={[
                    [latitude, longitude],
                    [selectedSupplier.lat!, selectedSupplier.lng!]
                  ]} 
                  color="#1B5E20" 
                  dashArray="10, 10"
                  weight={4}
                  opacity={0.7}
                />
              )}
            </MapContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          )}
          
          <div className="absolute bottom-12 right-6 flex flex-col gap-3 z-[1000]">
            <button 
              onClick={() => latitude && longitude && setSelectedSupplier(null)}
              className="bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 text-[#1B5E20] active:scale-95 transition-all"
            >
              <LocateFixed size={24} />
            </button>
            <button className="bg-[#1B5E20] p-4 rounded-2xl shadow-2xl border border-white/20 text-white active:scale-95 transition-all">
              <Compass size={24} />
            </button>
          </div>
        </div>

        {/* List Section */}
        <div className="flex-1 bg-white relative rounded-t-[32px] -mt-6 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.3)] z-40 border-t border-gray-100 flex flex-col pb-24">
          <div className="w-full flex justify-center pt-4 pb-2 shrink-0 bg-white rounded-t-[32px] z-50">
            <div className="w-16 h-1.5 bg-gray-200 rounded-full"></div>
          </div>
          
          <div className="px-6 py-4 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
                {loading ? 'Searching...' : `${suppliers.length} Suppliers Found`}
              </h2>
              <span className="text-xs font-black text-[#1B5E20] bg-[#E8F5E9] px-4 py-1.5 rounded-full shadow-sm">25km Radius</span>
            </div>
            
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
            ) : error ? (
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
                {suppliers.map((supplier) => (
                  <motion.div 
                    key={supplier.id}
                    ref={el => listRefs.current[supplier.id] = el}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedSupplier(supplier)}
                    className={`rounded-[40px] p-8 shadow-sm border transition-all cursor-pointer ${
                      selectedSupplier?.id === supplier.id 
                        ? 'bg-white border-[#1B5E20] shadow-2xl ring-8 ring-[#1B5E20]/5' 
                        : 'bg-white border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex flex-col">
                      <div className="flex justify-between items-start mb-8">
                        <div className="flex-1 pr-4">
                          <div className="flex flex-col gap-4">
                            <h3 className="text-2xl font-black text-earth tracking-tight leading-tight">{supplier.name}</h3>
                            <div className="flex items-center text-sm text-gray-500 font-bold gap-4">
                              <div className="flex items-center">
                                <MapPin size={18} className="mr-2 text-[#1B5E20]" />
                                <span>{supplier.distance} km away</span>
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
                      
                      <div className="flex gap-4">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`tel:${supplier.phone}`);
                          }}
                          className="flex-1 bg-[#1B5E20] hover:bg-[#144317] text-white text-base font-black py-4.5 rounded-[24px] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg shadow-green-900/20"
                        >
                          <Phone size={20} />
                          Contact
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(supplier.name + ' ' + (supplier.address || ''))}`, '_blank');
                          }}
                          className="flex-1 bg-white border-2 border-[#1B5E20] text-[#1B5E20] text-base font-black py-4.5 rounded-[24px] hover:bg-green-50 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                          <MapPin size={20} />
                          Locate
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
