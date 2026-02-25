import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingBag, Filter, Navigation, Star, Phone, MapPin, Loader2, LocateFixed, Compass } from 'lucide-react';
import { findNearbySuppliers, Supplier } from '../services/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';

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
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

export const Suppliers: React.FC<SuppliersProps> = ({ onBack, language }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const listRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (selectedSupplier && listRefs.current[selectedSupplier.id]) {
      listRefs.current[selectedSupplier.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedSupplier]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        try {
          let results = await findNearbySuppliers(latitude, longitude);
          
          // Enrich with mock coordinates and names from screenshot for demo
          const demoNames = ["AGRI ZONE-NELAMANGALA", "SLN Fertilizers", "Sri Sai Agro Corporation"];
          results = results.map((s, i) => ({
            ...s,
            name: i < demoNames.length ? demoNames[i] : s.name,
            lat: latitude + (Math.random() - 0.5) * 0.03,
            lng: longitude + (Math.random() - 0.5) * 0.03,
            distance: (Math.random() * 5 + 1).toFixed(1)
          }));

          setSuppliers(results);
          if (results.length > 0) {
            setSelectedSupplier(results[0]);
          }
        } catch (err) {
          console.error(err);
          setError("Failed to fetch nearby suppliers");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error(err);
        setError("Please enable location access to find nearby stores");
        setLoading(false);
      }
    );
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#F8F9FA]">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shrink-0 z-50 shadow-sm pt-12">
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

      <div className="bg-white px-4 py-4 border-b border-gray-100 overflow-x-auto whitespace-nowrap hide-scrollbar shrink-0 z-40">
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 px-6 py-2.5 rounded-full bg-[#1B5E20] text-white font-bold shadow-lg active:scale-95 transition-all">
            <Filter size={18} />
            <span>Filters</span>
          </button>
          {['Organic Seeds', 'Fungicides', 'Tools', 'Fertilizers'].map((tag, i) => (
            <button key={i} className={`px-6 py-2.5 rounded-full font-bold border transition-all ${
              tag === 'Fungicides' ? 'bg-[#E8F5E9] text-[#1B5E20] border-[#A5D6A7]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}>
              {tag}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 relative flex flex-col overflow-hidden">
        {/* Map Visualization */}
        <div className="h-[35vh] w-full relative bg-gray-200 shrink-0 z-10">
          {userLocation ? (
            <MapContainer 
              center={[userLocation.lat, userLocation.lng]} 
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
                  : [userLocation.lat, userLocation.lng]} 
                zoom={selectedSupplier ? 15 : 13} 
              />
              
              <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
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

              {selectedSupplier && userLocation && (
                <Polyline 
                  positions={[
                    [userLocation.lat, userLocation.lng],
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
              onClick={() => userLocation && setSelectedSupplier(null)}
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
        <div className="flex-1 bg-white overflow-y-auto pb-40 relative rounded-t-[40px] -mt-24 shadow-[0_-25px_50px_-12px_rgba(0,0,0,0.25)] z-40 border-t border-gray-50 flex flex-col">
          <div className="w-full flex justify-center pt-6 pb-2 shrink-0">
            <div className="w-20 h-2 bg-gray-200 rounded-full"></div>
          </div>
          
          <div className="px-6 py-4 flex-1">
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
                        <button className="flex-1 bg-[#1B5E20] hover:bg-[#144317] text-white text-base font-black py-4.5 rounded-[24px] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg shadow-green-900/20">
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
