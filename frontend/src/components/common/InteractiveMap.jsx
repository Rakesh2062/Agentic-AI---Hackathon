import React, { useEffect, useRef, useState } from "react";
import { 
  Search, 
  MapPin, 
  Navigation, 
  Layers, 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  Info,
  Compass,
  Building2,
  Sparkles
} from "lucide-react";
import { Priority, Status, StatusConfig, PriorityConfig } from "../../utils/constants";

// Google Maps Night / Futuristic Dark Theme (Preserves crisp visibility of roads, highways, transit & labels)
const GOOGLE_MAPS_DARK_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0b132b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b132b" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#38bdf8" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#64748b" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#064e3b" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#34d399" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#334155" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#cbd5e1" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#0369a1" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0284c7" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#e0f2fe" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#38bdf8" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0c4a6e" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#38bdf8" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#082f49" }],
  },
];

export function InteractiveMap({
  mode = "general", // 'general' | 'picker' | 'heatmap' | 'viewer'
  onLocationSelect = () => {},
  initialLat = 16.5062, // Vijayawada / Default City
  initialLng = 80.6480,
  initialZoom = 13,
  existingCases = [],
  selectedCase = null,
  height = "h-80 sm:h-96",
  onMarkerClick = null,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const searchInputRef = useRef(null);
  const activePickerMarkerRef = useRef(null);
  const complaintMarkersRef = useRef([]);
  const infoWindowRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [currentAddress, setCurrentAddress] = useState("");
  const [currentCoords, setCurrentCoords] = useState({ lat: initialLat, lng: initialLng });
  const [mapType, setMapType] = useState("roadmap"); // 'roadmap' | 'hybrid'
  const [isFullscreen, setIsFullscreen] = useState(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Load Google Maps JavaScript API
  useEffect(() => {
    if (!apiKey) {
      setLoadError("MISSING_KEY");
      return;
    }

    if (window.google && window.google.maps) {
      initMap();
      return;
    }

    const scriptId = "google-maps-js-sdk";
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initMap();
      };
      script.onerror = () => {
        setLoadError("LOAD_FAILED");
      };
      document.head.appendChild(script);
    } else {
      script.addEventListener("load", () => initMap());
    }

    return () => {
      // Cleanup markers
      complaintMarkersRef.current.forEach((m) => m.setMap(null));
      complaintMarkersRef.current = [];
    };
  }, [apiKey]);

  // Initialize Map
  const initMap = () => {
    if (!mapContainerRef.current || !window.google?.maps) return;

    try {
      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: { lat: initialLat, lng: initialLng },
        zoom: initialZoom,
        styles: mapType === "roadmap" ? GOOGLE_MAPS_DARK_STYLE : [],
        mapTypeId: mapType,
        disableDefaultUI: true, // We provide clean unified controls
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      mapInstanceRef.current = map;
      infoWindowRef.current = new window.google.maps.InfoWindow();

      // Setup Search Autocomplete if Places library is available
      if (window.google.maps.places && searchInputRef.current) {
        const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
          fields: ["geometry", "formatted_address", "name"],
        });
        autocomplete.bindTo("bounds", map);

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (!place.geometry || !place.geometry.location) {
            handleManualGeocodeSearch(searchInputRef.current.value);
            return;
          }

          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const addr = place.formatted_address || place.name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

          map.panTo(place.geometry.location);
          map.setZoom(16);
          setPinLocation(lat, lng, addr);
        });
      }

      // Picker Mode Click Listener
      if (mode === "picker") {
        map.addListener("click", (e) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          reverseGeocode(lat, lng);
        });

        // Initialize default picker marker
        setPinLocation(initialLat, initialLng, "Default City Center");
      }

      setMapLoaded(true);
      setLoadError(null);
    } catch (err) {
      console.error("Google Maps init error:", err);
      setLoadError("INIT_ERROR");
    }
  };

  // Render Real Complaint Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps || !mapLoaded) return;

    // Clear existing complaint markers
    complaintMarkersRef.current.forEach((m) => m.setMap(null));
    complaintMarkersRef.current = [];

    if (!existingCases || existingCases.length === 0) return;

    existingCases.forEach((c) => {
      const lat = c.location?.lat;
      const lng = c.location?.lng;
      if (typeof lat !== "number" || typeof lng !== "number") return;

      const markerColor =
        c.status === Status.RESOLVED || c.status === Status.CLOSED
          ? "#10b981"
          : c.priority === Priority.CRITICAL
          ? "#ef4444"
          : c.priority === Priority.HIGH
          ? "#f97316"
          : c.priority === Priority.MEDIUM
          ? "#eab308"
          : "#0284c7";

      // SVG Icon with dynamic color
      const svgIcon = {
        path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
        fillColor: markerColor,
        fillOpacity: 0.95,
        strokeWeight: 1.5,
        strokeColor: "#ffffff",
        scale: 1.5,
        anchor: new window.google.maps.Point(12, 22),
      };

      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: mapInstanceRef.current,
        title: c.summary || c.raw_text,
        icon: svgIcon,
      });

      marker.addListener("click", () => {
        if (onMarkerClick) {
          onMarkerClick(c);
        }

        if (infoWindowRef.current) {
          const content = `
            <div style="color: #0f172a; font-family: sans-serif; padding: 6px; max-width: 240px;">
              <div style="font-weight: 800; font-size: 13px; color: #0284c7; margin-bottom: 2px;">
                ${c.complaint_id || "Case"}
              </div>
              <div style="font-weight: 700; font-size: 12px; margin-bottom: 4px;">
                ${c.title || c.summary || "Incident"}
              </div>
              <div style="font-size: 11px; color: #475569; margin-bottom: 6px;">
                ${c.location?.address || ""}
              </div>
              <div style="display: inline-block; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: ${markerColor}20; color: ${markerColor}; border: 1px solid ${markerColor};">
                ${(c.priority || "MEDIUM").toUpperCase()} PRIORITY • ${(c.status || "OPEN").toUpperCase()}
              </div>
            </div>
          `;
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open(mapInstanceRef.current, marker);
        }
      });

      complaintMarkersRef.current.push(marker);
    });
  }, [existingCases, mapLoaded, mode]);

  // Set & Update Picker Pin
  const setPinLocation = (lat, lng, formattedAddress) => {
    setCurrentCoords({ lat, lng });
    setCurrentAddress(formattedAddress);

    onLocationSelect({
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      address: formattedAddress,
    });

    if (!mapInstanceRef.current || !window.google?.maps) return;

    if (activePickerMarkerRef.current) {
      activePickerMarkerRef.current.setPosition({ lat, lng });
    } else {
      activePickerMarkerRef.current = new window.google.maps.Marker({
        position: { lat, lng },
        map: mapInstanceRef.current,
        draggable: mode === "picker",
        title: "Selected Location",
        animation: window.google.maps.Animation.DROP,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: "#38bdf8",
          fillOpacity: 1,
          strokeWeight: 3,
          strokeColor: "#ffffff",
        },
      });

      if (mode === "picker") {
        activePickerMarkerRef.current.addListener("dragend", (e) => {
          reverseGeocode(e.latLng.lat(), e.latLng.lng());
        });
      }
    }
  };

  // Reverse Geocoding
  const reverseGeocode = (lat, lng) => {
    if (!window.google?.maps) return;
    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      let addr = `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      if (status === "OK" && results && results[0]) {
        addr = results[0].formatted_address;
      }
      setPinLocation(lat, lng, addr);
    });
  };

  // Manual Geocode Search (Worldwide: Vijayawada, Delhi, Kathmandu, London, etc.)
  const handleManualGeocodeSearch = (queryText) => {
    const q = (queryText || searchQuery).trim();
    if (!q || !window.google?.maps || !mapInstanceRef.current) return;

    setSearching(true);
    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode({ address: q }, (results, status) => {
      setSearching(false);
      if (status === "OK" && results && results[0]) {
        const loc = results[0].geometry.location;
        const lat = loc.lat();
        const lng = loc.lng();
        const addr = results[0].formatted_address;

        mapInstanceRef.current.panTo(loc);
        mapInstanceRef.current.setZoom(15);
        setPinLocation(lat, lng, addr);
      } else {
        alert(`Location "${q}" not found on Google Maps. Please check spelling.`);
      }
    });
  };

  // Current GPS Location
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDetectingLocation(false);
        const { latitude, longitude } = pos.coords;

        if (mapInstanceRef.current && window.google?.maps) {
          mapInstanceRef.current.panTo({ lat: latitude, lng: longitude });
          mapInstanceRef.current.setZoom(16);
        }
        reverseGeocode(latitude, longitude);
      },
      (err) => {
        setDetectingLocation(false);
        alert("Location access was denied. You can search for any location manually in the search box.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Toggle Map Type (Roadmap Dark vs Satellite Hybrid)
  const toggleMapType = () => {
    const nextType = mapType === "roadmap" ? "hybrid" : "roadmap";
    setMapType(nextType);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapTypeId(nextType);
      if (nextType === "roadmap") {
        mapInstanceRef.current.setOptions({ styles: GOOGLE_MAPS_DARK_STYLE });
      } else {
        mapInstanceRef.current.setOptions({ styles: [] });
      }
    }
  };

  // Zoom Helpers
  const handleZoom = (delta) => {
    if (!mapInstanceRef.current) return;
    const current = mapInstanceRef.current.getZoom();
    mapInstanceRef.current.setZoom(current + delta);
  };

  // Missing API Key / Error Screen
  if (loadError) {
    return (
      <div className={`relative ${height} w-full rounded-2xl overflow-hidden border border-amber-900/60 bg-slate-950 p-6 flex flex-col items-center justify-center text-center space-y-3`}>
        <AlertTriangle className="w-10 h-10 text-amber-400 animate-pulse" />
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Google Maps could not be loaded
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            Please configure a valid <code className="text-sky-300 font-mono">VITE_GOOGLE_MAPS_API_KEY</code> in your environment file.
          </p>
        </div>
        <p className="text-[11px] text-slate-500 font-mono">
          Enable: Maps JavaScript API, Places API, Geocoding API in Google Cloud Console.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative ${height} w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl`}>
      
      {/* Top Floating Search & Location Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pointer-events-auto">
        
        {/* Search Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleManualGeocodeSearch();
          }}
          className="flex-1 relative"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search any city, street, landmark worldwide (e.g. Vijayawada, Delhi, Tirupati)..."
            className="w-full bg-slate-900/90 backdrop-blur-md border border-slate-700 focus:border-sky-500 rounded-xl pl-9 pr-20 py-2 text-xs text-slate-100 placeholder-slate-400 outline-none shadow-lg"
          />
          <button
            type="submit"
            disabled={searching || !searchQuery.trim()}
            className="absolute right-1.5 top-1.5 px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold shadow transition disabled:opacity-40"
          >
            {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Search"}
          </button>
        </form>

        {/* Current Location & Map Type Controls */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleCurrentLocation}
            disabled={detectingLocation}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 hover:border-sky-500 text-sky-400 text-xs font-semibold shadow-lg transition"
            title="Use My Current GPS Location"
          >
            {detectingLocation ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Navigation className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Current Location</span>
          </button>

          <button
            type="button"
            onClick={toggleMapType}
            className="px-3 py-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 hover:border-sky-500 text-slate-200 text-xs font-semibold shadow-lg transition"
            title="Toggle Map / Satellite"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Floating Zoom & Control Pillar */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700 shadow-xl">
        <button
          type="button"
          onClick={() => handleZoom(1)}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => handleZoom(-1)}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* Selected Address Banner in Picker Mode */}
      {mode === "picker" && currentAddress && (
        <div className="absolute bottom-4 left-4 right-16 z-20 bg-slate-900/95 backdrop-blur-md border border-sky-500/50 rounded-xl p-2.5 px-3.5 text-xs text-slate-200 shadow-2xl flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
              Pinned Incident Location:
            </span>
            <p className="font-semibold text-white truncate text-xs">{currentAddress}</p>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 flex-shrink-0">
            Selected ✓
          </span>
        </div>
      )}

      {/* Real Google Maps Container */}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}

// Export as both InteractiveMap and GoogleInteractiveMap for compatibility
export default InteractiveMap;
