import React, { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Users, Building2, Clock, Navigation } from 'lucide-react';

// Fix for default Leaflet icon not showing correctly in Vite/React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom colored icons using DivIcon for premium feel and easy color control
const createCustomIcon = (colorHex) => {
  return L.divIcon({
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; inset: 0; border-radius: 9999px; border: 2px solid rgba(255,255,255,0.2); filter: blur(1px);"></div>
        <div style="position: absolute; inset: 2px; border-radius: 9999px; background-color: ${colorHex}; opacity: 0.25;"></div>
        <div style="position: relative; width: 16px; height: 16px; border-radius: 9999px; background-color: ${colorHex}; border: 2px solid white; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;">
          <div style="width: 6px; height: 6px; border-radius: 9999px; background-color: rgba(255,255,255,0.4);"></div>
        </div>
      </div>
    `,
    className: 'custom-leaflet-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// User Location Icon
const userLocationIcon = L.divIcon({
  html: `
    <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; inset: 0; border-radius: 9999px; background-color: rgba(37, 99, 235, 0.2); animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="position: relative; width: 20px; height: 20px; background-color: #2563eb; border-radius: 9999px; border: 2px solid white; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center;">
        <div style="width: 8px; height: 8px; background-color: white; border-radius: 9999px;"></div>
      </div>
    </div>
    <style>
      @keyframes ping {
        75%, 100% { transform: scale(2); opacity: 0; }
      }
    </style>
  `,
  className: 'user-location-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const icons = {
  red: createCustomIcon('#f43f5e'), // rose-500
  yellow: createCustomIcon('#f59e0b'), // amber-500
  green: createCustomIcon('#10b981') // emerald-500
};

// Helper component to handle map centering
const MapController = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

const IssueMap = ({ issues, loading }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([19.0760, 72.8777]); // Default Mumbai
  const [hasSetInitialCenter, setHasSetInitialCenter] = useState(false);

  // 1. Get User Location on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('IssueMap: User location found', latitude, longitude);
          setUserLocation([latitude, longitude]);
          if (!hasSetInitialCenter) {
            setMapCenter([latitude, longitude]);
            setHasSetInitialCenter(true);
          }
        },
        (error) => {
          console.error("IssueMap: Geolocation error", error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, []);

  // 2. Adjust center if user location fails but issues exist
  useEffect(() => {
    if (!hasSetInitialCenter && issues && issues.length > 0) {
      const coords = issues.filter(i => i.latitude && i.longitude);
      if (coords.length > 0) {
        const lat = coords.reduce((acc, curr) => acc + parseFloat(curr.latitude), 0) / coords.length;
        const lng = coords.reduce((acc, curr) => acc + parseFloat(curr.longitude), 0) / coords.length;
        setMapCenter([lat, lng]);
        setHasSetInitialCenter(true);
      }
    }
  }, [issues, hasSetInitialCenter]);

  const mapIssues = useMemo(() => {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000));

    if (!issues) return [];
    
    console.log(`IssueMap: Processing ${issues.length} raw issues`);

    const filtered = issues
      .filter(issue => {
        const lat = parseFloat(issue.latitude);
        const lng = parseFloat(issue.longitude);
        if (isNaN(lat) || isNaN(lng)) return false;
        
        const status = (issue.status || '').toLowerCase();
        
        if (status === 'resolved' && issue.resolved_at && new Date(issue.resolved_at) < twoDaysAgo) return false;
        if (status === 'rejected') return false;

        const valid = ['pending', 'reported', 'acknowledged', 'in progress', 'resolved'].includes(status);
        return valid;
      })
      .map(issue => {
        const status = (issue.status || '').toLowerCase();
        let pinColor = 'red';
        if (status === 'in progress') pinColor = 'yellow';
        if (status === 'resolved') pinColor = 'green';
        
        return {
          ...issue,
          lat: parseFloat(issue.latitude),
          lng: parseFloat(issue.longitude),
          displayStatus: issue.status === 'Pending' ? 'Reported' : issue.status,
          pinColor
        };
      });

    console.log(`IssueMap: ${filtered.length} issues passed criteria`);
    return filtered;
  }, [issues]);

  if (loading && (!issues || issues.length === 0)) {
    return (
      <div className="w-full h-[60vh] bg-slate-900/50 rounded-[2.5rem] border border-white/5 flex flex-col items-center justify-center text-slate-500 gap-4">
        <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest italic">Synchronizing Fleet Coordinates...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[500px] rounded-[2.5rem] overflow-hidden border border-white/10 relative shadow-2xl bg-slate-900">
      {/* Map Header Overlay */}
      <div className="absolute top-6 left-6 z-[1000] pointer-events-none">
        <div className="bg-slate-950/80 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 shadow-2xl flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
            <MapPin size={22} />
          </div>
          <div>
            <h4 className="text-lg font-black text-white tracking-tight leading-none">Live Issue Network</h4>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">Real-time Civic Telemetry</p>
          </div>
        </div>
      </div>

      {/* Legend Overlay */}
      <div className="absolute bottom-6 right-6 z-[1000] pointer-events-none">
        <div className="bg-slate-950/80 backdrop-blur-md px-5 py-4 rounded-3xl border border-white/10 shadow-2xl space-y-3">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 font-mono">Telemetry Key</p>
          {[
            { label: 'Unresolved Case', color: '#f43f5e' },
            { label: 'Units Active', color: '#f59e0b' },
            { label: 'Cleared (Last 48h)', color: '#10b981' },
            { label: 'Your Position', color: '#2563eb' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full shadow-lg" style={{ backgroundColor: item.color }} />
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <MapContainer 
        center={mapCenter} 
        zoom={13} 
        className="w-full h-full"
        style={{ background: '#0f172a' }}
      >
        <MapController center={mapCenter} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* User Current Location Marker */}
        {userLocation && (
          <Marker position={userLocation} icon={userLocationIcon}>
            <Popup className="premium-popup">
              <div className="p-2 text-center">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Status</p>
                <p className="text-sm font-bold text-slate-800">Your Current Position</p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Render Markers AND CircleMarkers to ensure visibility */}
        {mapIssues.map((issue) => (
          <React.Fragment key={issue.id}>
            <CircleMarker 
              center={[issue.lat, issue.lng]} 
              radius={8}
              pathOptions={{ 
                fillColor: issue.pinColor === 'red' ? '#f43f5e' : issue.pinColor === 'yellow' ? '#f59e0b' : '#10b981',
                color: 'white',
                weight: 2,
                fillOpacity: 0.9 
              }}
            />
            <Marker 
              position={[issue.lat, issue.lng]} 
              icon={icons[issue.pinColor]}
            >
              <Popup className="premium-popup">
                <div className="w-64 p-1 text-slate-900">
                  <header className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
                        issue.pinColor === 'red' ? 'bg-rose-500/20 text-rose-500' :
                        issue.pinColor === 'yellow' ? 'bg-amber-500/20 text-amber-500' :
                        'bg-emerald-500/20 text-emerald-500'
                      }`}>
                        {issue.displayStatus || issue.status}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 ml-auto font-mono">
                        #{issue.id.slice(0, 8)}
                      </span>
                    </div>
                    <h5 className="text-sm font-black text-slate-800 leading-tight">{issue.title}</h5>
                  </header>

                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Building2 size={13} className="text-slate-400" />
                      <span className="font-bold">{issue.departments?.name || 'In Triage'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <MapPin size={13} className="text-slate-400" />
                      <span className="truncate">{issue.location_label || 'Reported Vicinity'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                       <div className="bg-slate-100 p-2 rounded-xl flex flex-col">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Impact</span>
                          <span className="text-xs font-black text-slate-700 flex items-center gap-1">
                             <Users size={10} /> {issue.unique_user_count || 1}
                          </span>
                       </div>
                       <div className="bg-blue-50 p-2 rounded-xl flex flex-col">
                          <span className="text-[8px] font-black text-blue-400 uppercase tracking-tighter">Score</span>
                          <span className="text-xs font-black text-blue-700 flex items-center gap-1">
                             <Navigation size={10} /> {issue.priority_score?.toFixed(1) || '—'}
                          </span>
                       </div>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}
      </MapContainer>

      <style>{`
        .premium-popup .leaflet-popup-content-wrapper {
          border-radius: 20px;
          padding: 8px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }
        .premium-popup .leaflet-popup-tip {
          box-shadow: none;
        }
        .custom-leaflet-icon, .user-location-icon {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-container {
          filter: grayscale(0.5) contrast(1.1) brightness(0.9);
        }
      `}</style>
    </div>
  );
};

export default IssueMap;
