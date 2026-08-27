import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Search,
  MapPin,
  Navigation,
  Layers,
  ZoomIn,
  ZoomOut,
  Loader2,
  Check,
  AlertCircle,
  Radio,
  X,
  Building,
  Landmark,
  Compass
} from "lucide-react";
import { Priority, Status } from "../../utils/constants";

// Tile Layer Configuration
const TILE_LAYERS = {
  voyager: {
    name: "Standard Map",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 20
  },
  dark: {
    name: "Dark Map",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 20
  },
  satellite: {
    name: "Satellite Map",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    subdomains: "",
    maxZoom: 19
  }
};

export function InteractiveMap({
  mode = "general", // 'general' | 'picker' | 'heatmap' | 'viewer'
  onLocationSelect = () => {},
  initialLat = 16.5062, // Vijayawada / Default City
  initialLng = 80.648,
  initialZoom = 13,
  existingCases = [],
  selectedCase = null,
  height = "h-80 sm:h-96",
  onMarkerClick = null,
}) {
  const mapContainerRef = useRef(null);
  const searchContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const activePickerMarkerRef = useRef(null);
  const userLocationMarkerRef = useRef(null);
  const userAccuracyCircleRef = useRef(null);
  const watchIdRef = useRef(null);
  const complaintMarkersRef = useRef([]);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentAddress, setCurrentAddress] = useState("");
  const [userLocation, setUserLocation] = useState(null); // { lat, lng, accuracy }
  const [currentCoords, setCurrentCoords] = useState({
    lat: initialLat,
    lng: initialLng,
  });
  const [activeStyleKey, setActiveStyleKey] = useState("voyager");

  // Helper to extract municipal ward/district from Nominatim details
  const extractWardFromAddress = (addressDetails) => {
    if (!addressDetails) return "";
    return (
      addressDetails.suburb ||
      addressDetails.city_district ||
      addressDetails.neighbourhood ||
      addressDetails.quarter ||
      addressDetails.borough ||
      addressDetails.county ||
      addressDetails.town ||
      addressDetails.village ||
      addressDetails.municipality ||
      ""
    );
  };

  // Set & Update Incident Picker Pin (distinct from User Current Location)
  const setPinLocation = useCallback(
    (lat, lng, formattedAddress, wardInfo) => {
      setCurrentCoords({ lat, lng });
      setCurrentAddress(formattedAddress);

      onLocationSelect({
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        address: formattedAddress,
        ward: wardInfo || "",
      });

      if (!mapInstanceRef.current) return;

      const incidentIcon = L.divIcon({
        className: "custom-incident-pin",
        html: `
          <div style="filter: drop-shadow(0 3px 8px rgba(0,0,0,0.6)); cursor: grab; transform: translate(-50%, -100%);">
            <svg width="34" height="42" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 18 12 18s12-9 12-18C24 5.37 18.63 0 12 0z" fill="#0284c7" stroke="#ffffff" stroke-width="2"/>
              <circle cx="12" cy="11" r="5" fill="#ffffff"/>
              <circle cx="12" cy="11" r="2.5" fill="#0284c7"/>
            </svg>
          </div>
        `,
        iconSize: [34, 42],
        iconAnchor: [17, 42],
      });

      if (activePickerMarkerRef.current) {
        activePickerMarkerRef.current.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], {
          icon: incidentIcon,
          draggable: mode === "picker",
          zIndexOffset: 1000,
        }).addTo(mapInstanceRef.current);

        if (mode === "picker") {
          marker.on("dragend", (e) => {
            const position = e.target.getLatLng();
            reverseGeocode(position.lat, position.lng);
          });
        }

        activePickerMarkerRef.current = marker;
      }
    },
    [mode, onLocationSelect]
  );

  // Update Blue GPS "Current Location" Pointer & Accuracy Circle
  const updateUserLocationPointer = useCallback((lat, lng, accuracy) => {
    if (!mapInstanceRef.current) return;

    setUserLocation({ lat, lng, accuracy });

    // 1. Blue Pulsing GPS Dot Icon (Google Maps Style)
    const userLocationIcon = L.divIcon({
      className: "google-maps-current-location-marker",
      html: `
        <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
          <!-- Outer Pulsing Ripple Wave -->
          <div style="
            position: absolute;
            width: 100%;
            height: 100%;
            background-color: rgba(59, 130, 246, 0.4);
            border-radius: 50%;
            animation: pulse-gps-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
          "></div>
          <!-- White Outer Border Ring -->
          <div style="
            position: relative;
            width: 18px;
            height: 18px;
            background: #ffffff;
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(0,0,0,0.4), 0 2px 5px rgba(37,99,235,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <!-- Inner Solid Blue Dot -->
            <div style="
              width: 12px;
              height: 12px;
              background: #2563eb;
              border-radius: 50%;
            "></div>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.setLatLng([lat, lng]);
    } else {
      const userMarker = L.marker([lat, lng], {
        icon: userLocationIcon,
        zIndexOffset: 800,
      }).addTo(mapInstanceRef.current);

      userMarker.bindPopup(`
        <div style="font-family: sans-serif; padding: 4px 6px; text-align: center;">
          <div style="font-weight: 800; font-size: 12px; color: #2563eb; display: flex; align-items: center; justify-content: center; gap: 4px;">
            <span>📍</span> Your Current GPS Location
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
            Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}
          </div>
          ${accuracy ? `<div style="font-size: 10px; color: #10b981; margin-top: 2px;">Accuracy: ±${Math.round(accuracy)}m</div>` : ""}
        </div>
      `);

      userLocationMarkerRef.current = userMarker;
    }

    // 2. Blue Accuracy Circle
    if (accuracy && accuracy > 5) {
      if (userAccuracyCircleRef.current) {
        userAccuracyCircleRef.current.setLatLng([lat, lng]);
        userAccuracyCircleRef.current.setRadius(accuracy);
      } else {
        const circle = L.circle([lat, lng], {
          radius: accuracy,
          color: "#2563eb",
          fillColor: "#3b82f6",
          fillOpacity: 0.12,
          weight: 1.5,
          dashArray: "3, 6",
        }).addTo(mapInstanceRef.current);

        userAccuracyCircleRef.current = circle;
      }
    } else if (userAccuracyCircleRef.current) {
      userAccuracyCircleRef.current.remove();
      userAccuracyCircleRef.current = null;
    }
  }, []);

  // Reverse Geocoding using Nominatim
  const reverseGeocode = useCallback(
    async (lat, lng) => {
      let addr = `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      let wardInfo = "";

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          {
            headers: {
              "Accept-Language": "en",
            },
          }
        );
        const data = await res.json();
        if (data && data.display_name) {
          addr = data.display_name;
        }
        if (data && data.address) {
          wardInfo = extractWardFromAddress(data.address);
        }
      } catch (err) {
        console.warn("Reverse geocode error:", err);
      }

      setPinLocation(lat, lng, addr, wardInfo);
    },
    [setPinLocation]
  );

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: false,
    });

    const initialLayerConfig = TILE_LAYERS[activeStyleKey];
    const tileLayer = L.tileLayer(initialLayerConfig.url, {
      attribution: initialLayerConfig.attribution,
      subdomains: initialLayerConfig.subdomains,
      maxZoom: initialLayerConfig.maxZoom,
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    mapInstanceRef.current = map;

    // Force tile recalculation on mount
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    // Picker Mode Click Listener
    if (mode === "picker") {
      map.on("click", (e) => {
        setShowSuggestions(false);
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      });

      // Default Pin
      setPinLocation(initialLat, initialLng, "Default City Center", "");
    }

    setMapLoaded(true);

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced Autocomplete Places Search
  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1`,
          {
            headers: {
              "Accept-Language": "en",
            },
          }
        );
        const data = await res.json();
        if (data && Array.isArray(data)) {
          const parsed = data.map((item) => {
            const parts = (item.display_name || "").split(", ");
            const mainTitle = parts[0] || item.name || "Location";
            const subtitle = parts.slice(1, 4).join(", ") || parts.slice(1).join(", ");
            const ward = extractWardFromAddress(item.address);
            return {
              id: item.place_id || Math.random().toString(),
              mainTitle,
              subtitle,
              fullAddress: item.display_name,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
              ward,
              type: item.type || item.class || "place",
            };
          });
          setSuggestions(parsed);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.warn("Autocomplete suggestions error:", err);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 320);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update Tile Layer Style
  const toggleMapType = useCallback(() => {
    if (!mapInstanceRef.current) return;

    const stylesOrder = ["voyager", "dark", "satellite"];
    const currentIndex = stylesOrder.indexOf(activeStyleKey);
    const nextKey = stylesOrder[(currentIndex + 1) % stylesOrder.length];
    const nextConfig = TILE_LAYERS[nextKey];

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const newLayer = L.tileLayer(nextConfig.url, {
      attribution: nextConfig.attribution,
      subdomains: nextConfig.subdomains,
      maxZoom: nextConfig.maxZoom,
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newLayer;
    setActiveStyleKey(nextKey);
  }, [activeStyleKey]);

  // Render Complaint Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    // Clear existing markers
    complaintMarkersRef.current.forEach((m) => m.remove());
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

      const caseIcon = L.divIcon({
        className: "complaint-marker-icon",
        html: `
          <div style="filter: drop-shadow(0 2px 5px rgba(0,0,0,0.5)); cursor: pointer;">
            <svg width="28" height="36" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 18 12 18s12-9 12-18C24 5.37 18.63 0 12 0z" fill="${markerColor}" stroke="#ffffff" stroke-width="1.8"/>
              <circle cx="12" cy="11" r="4.5" fill="#ffffff"/>
            </svg>
          </div>
        `,
        iconSize: [28, 36],
        iconAnchor: [14, 36],
      });

      const marker = L.marker([lat, lng], { icon: caseIcon }).addTo(mapInstanceRef.current);

      const popupHtml = `
        <div style="color: #0f172a; font-family: sans-serif; padding: 6px; max-width: 240px;">
          <div style="font-weight: 800; font-size: 12px; color: #0284c7; margin-bottom: 2px;">
            ${c.complaint_id || "Case"}
          </div>
          <div style="font-weight: 700; font-size: 12px; margin-bottom: 4px; color: #0f172a;">
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

      marker.bindPopup(popupHtml);

      marker.on("click", () => {
        if (onMarkerClick) onMarkerClick(c);
      });

      complaintMarkersRef.current.push(marker);
    });
  }, [existingCases, mapLoaded, onMarkerClick]);

  // Focus the map when a complaint is selected outside the map (for example,
  // from the analytics hotspot list).
  useEffect(() => {
    const lat = selectedCase?.location?.lat;
    const lng = selectedCase?.location?.lng;
    if (!mapInstanceRef.current || !mapLoaded || typeof lat !== "number" || typeof lng !== "number") return;

    mapInstanceRef.current.setView([lat, lng], 16, { animate: true });
  }, [selectedCase, mapLoaded]);

  // Select a suggestion from the dropdown
  const handleSelectSuggestion = useCallback(
    (place) => {
      setShowSuggestions(false);
      setSearchQuery(place.mainTitle);
      setErrorMessage("");

      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([place.lat, place.lng], 16, { animate: true });
      }

      setPinLocation(place.lat, place.lng, place.fullAddress, place.ward);
    },
    [setPinLocation]
  );

  // Forward Geocode Search (on Search button or Enter key)
  const handleManualGeocodeSearch = useCallback(
    async (queryText) => {
      const q = (queryText || searchQuery).trim();
      if (!q || !mapInstanceRef.current) return;

      setShowSuggestions(false);
      setSearching(true);
      setErrorMessage("");

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&addressdetails=1`,
          {
            headers: {
              "Accept-Language": "en",
            },
          }
        );
        const results = await res.json();

        if (results && results.length > 0) {
          const place = results[0];
          const lat = parseFloat(place.lat);
          const lng = parseFloat(place.lon);
          const addr = place.display_name;
          const wardInfo = place.address ? extractWardFromAddress(place.address) : "";

          mapInstanceRef.current.setView([lat, lng], 15, { animate: true });
          setPinLocation(lat, lng, addr, wardInfo);
        } else {
          setErrorMessage(`Location "${q}" not found. Please check spelling or try another query.`);
        }
      } catch (err) {
        console.error("Geocode search error:", err);
        setErrorMessage("Search failed. Please check internet connection.");
      } finally {
        setSearching(false);
      }
    },
    [searchQuery, setPinLocation]
  );

  // "📍 My Location" Handler with real Browser Geolocation API & Accuracy Circle
  const handleCurrentLocation = useCallback(() => {
    setShowSuggestions(false);
    setErrorMessage("");

    if (!navigator.geolocation) {
      setErrorMessage("Geolocation is not supported by your browser. You can search for a location manually.");
      return;
    }

    setDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDetectingLocation(false);
        const { latitude, longitude, accuracy } = pos.coords;

        // 1. Center map smoothly to user location
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 16, { animate: true });
        }

        // 2. Draw/Update the distinctive blue Google Maps-style current location pointer & accuracy circle
        updateUserLocationPointer(latitude, longitude, accuracy);

        // 3. In picker mode, also reverse geocode and set the incident pin to current location
        if (mode === "picker") {
          reverseGeocode(latitude, longitude);
        }

        // 4. Start live location watching so moving updates the blue pointer
        if (!watchIdRef.current) {
          try {
            watchIdRef.current = navigator.geolocation.watchPosition(
              (watchPos) => {
                const { latitude: wLat, longitude: wLng, accuracy: wAcc } = watchPos.coords;
                updateUserLocationPointer(wLat, wLng, wAcc);
              },
              (err) => console.warn("Live GPS watch warning:", err),
              { enableHighAccuracy: true, maximumAge: 5000 }
            );
            setIsLiveTracking(true);
          } catch (e) {
            console.warn("Watch position not supported:", e);
          }
        }
      },
      (error) => {
        setDetectingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          setErrorMessage("Location permission is required to detect your current location. You can search for a location manually.");
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setErrorMessage("GPS / location service is unavailable on your device. You can search for a location manually.");
        } else if (error.code === error.TIMEOUT) {
          setErrorMessage("Location request timed out. Please try again or search manually.");
        } else {
          setErrorMessage("Could not retrieve location. You can search for any location manually.");
        }
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  }, [mode, reverseGeocode, updateUserLocationPointer]);

  // Zoom Helpers
  const handleZoom = useCallback((delta) => {
    if (!mapInstanceRef.current) return;
    const current = mapInstanceRef.current.getZoom();
    mapInstanceRef.current.setZoom(current + delta);
  }, []);

  return (
    <div className={`relative ${height} w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl`}>
      
      {/* Top Floating Search & Location Bar */}
      <div className="absolute top-3 left-3 right-3 z-[450] flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pointer-events-auto">
        
        {/* Search Box with Real-Time Autocomplete Suggestions Dropdown */}
        <div
          ref={searchContainerRef}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              handleManualGeocodeSearch();
            } else if (e.key === "Escape") {
              setShowSuggestions(false);
            }
          }}
          className="flex-1 relative"
        >
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              placeholder="Search Delhi, Vijayawada, Janakpur, Tirupati, Vignan University..."
              className="w-full bg-slate-900/95 backdrop-blur-md border border-slate-700 focus:border-sky-500 rounded-xl pl-9 pr-24 py-2 text-xs text-slate-100 placeholder-slate-400 outline-none shadow-lg"
            />

            {/* Clear Query button */}
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
                className="absolute right-16 p-1 text-slate-400 hover:text-slate-200 rounded-full transition"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}

            {/* Search Action Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleManualGeocodeSearch();
              }}
              disabled={searching || !searchQuery.trim()}
              className="absolute right-1.5 px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold shadow transition disabled:opacity-40 flex items-center gap-1"
            >
              {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Search"}
            </button>
          </div>

          {/* Real-time Autocomplete Suggestions Dropdown */}
          {showSuggestions && searchQuery.trim().length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900/95 backdrop-blur-xl border border-slate-700/90 rounded-xl shadow-2xl overflow-hidden z-[500] max-h-64 overflow-y-auto animate-fadeIn divide-y divide-slate-800/60">
              {loadingSuggestions && suggestions.length === 0 ? (
                <div className="p-3.5 flex items-center justify-center gap-2 text-xs text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                  <span>Searching places worldwide...</span>
                </div>
              ) : suggestions.length > 0 ? (
                suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-sky-950/50 flex items-start gap-2.5 transition group"
                  >
                    <div className="mt-0.5 p-1 rounded-md bg-slate-800/80 group-hover:bg-sky-500/20 text-sky-400 flex-shrink-0">
                      {item.type === "university" || item.type === "college" || item.type === "school" ? (
                        <Building className="w-3.5 h-3.5" />
                      ) : item.type === "city" || item.type === "administrative" ? (
                        <Compass className="w-3.5 h-3.5" />
                      ) : item.type === "historic" || item.type === "monument" ? (
                        <Landmark className="w-3.5 h-3.5" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-100 group-hover:text-sky-300 truncate">
                        {item.mainTitle}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </div>
                    </div>
                  </button>
                ))
              ) : !loadingSuggestions ? (
                <div className="p-3.5 text-center text-xs text-slate-400">
                  No places found for "<span className="text-slate-200">{searchQuery}</span>"
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* 📍 "My Location" Button & Map Style Switcher */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto flex-shrink-0">
          <button
            type="button"
            onClick={handleCurrentLocation}
            disabled={detectingLocation}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl backdrop-blur-md border transition text-xs font-semibold shadow-lg ${
              isLiveTracking
                ? "bg-blue-950/90 border-blue-500 text-blue-300 ring-1 ring-blue-500/50"
                : "bg-slate-900/95 border-slate-700 hover:border-blue-500 text-blue-400 hover:text-blue-300"
            }`}
            title="📍 Request GPS & Center on My Current Location"
          >
            {detectingLocation ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
            ) : isLiveTracking ? (
              <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            ) : (
              <Navigation className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span className="font-bold">📍 My Location</span>
          </button>

          <button
            type="button"
            onClick={toggleMapType}
            className="px-3 py-2 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700 hover:border-sky-500 text-slate-200 text-xs font-semibold shadow-lg transition flex items-center gap-1"
            title={`Current Style: ${TILE_LAYERS[activeStyleKey].name} (Click to toggle)`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono capitalize hidden md:inline">{activeStyleKey}</span>
          </button>
        </div>

      </div>

      {/* Floating Zoom Controls */}
      <div className="absolute bottom-4 right-4 z-[400] flex flex-col gap-1.5 bg-slate-900/95 backdrop-blur-md p-1 rounded-xl border border-slate-700 shadow-xl">
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

      {/* Error Message Toast */}
      {errorMessage && (
        <div className="absolute top-16 left-3 right-3 z-[400] bg-rose-950/95 border border-rose-600/80 rounded-xl p-2.5 px-3 text-xs text-rose-200 shadow-2xl flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage("")}
            className="text-rose-300 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded bg-rose-900/60"
          >
            ✕
          </button>
        </div>
      )}

      {/* Selected Incident Address Banner in Picker Mode */}
      {mode === "picker" && currentAddress && (
        <div className="absolute bottom-4 left-4 right-20 z-[400] bg-slate-900/95 backdrop-blur-md border border-sky-500/50 rounded-xl p-2.5 px-3.5 text-xs text-slate-200 shadow-2xl flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
              Pinned Incident Location:
            </span>
            <p className="font-semibold text-white truncate text-xs">{currentAddress}</p>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 flex-shrink-0 flex items-center gap-1">
            <Check className="w-3 h-3" /> Selected
          </span>
        </div>
      )}

      {/* Real Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-[10]" />

      {/* GPS Pulsing Ring Animation Styles */}
      <style>{`
        @keyframes pulse-gps-ring {
          0% {
            transform: scale(0.6);
            opacity: 0.9;
          }
          80%, 100% {
            transform: scale(2.4);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default InteractiveMap;
