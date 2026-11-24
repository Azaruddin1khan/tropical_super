'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Bike,
  Navigation,
  Compass,
  Play,
  Pause,
  RotateCcw,
  Shield,
  Clock,
  Layers,
  MapPin,
  ExternalLink,
  Zap,
  Maximize2,
  Crosshair,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DeliveryStaff, Order } from '@/types';
import {
  NASSAU_STREET_ROUTE,
  NASSAU_EAST_ROUTE,
  NASSAU_PATROL_ROUTE,
} from '@/data/nassau-route';
import 'leaflet/dist/leaflet.css';

// Official Nassau Flagship Coordinates (Rosetta St, Palmdale, Nassau, Bahamas)
const STORE_LOCATION: [number, number] = [25.068135, -77.327188]; // Tropical Gyros Flagship
const DELIVERY_RADIUS_METERS = 4828; // Strict 3.0-mile boundary (1609.34m * 3)

interface DriverTelemetry {
  driverId: string;
  driverName: string;
  avatarUrl: string;
  vehicleNumber: string;
  vehicleType: string;
  status: 'on_delivery' | 'available' | 'offline';
  orderId?: string;
  customerName?: string;
  customerAddress?: string;
  currentLat: number;
  currentLng: number;
  heading: number; // 0-360 degrees
  speedKmh: number;
  batteryPct: number;
  routeProgress: number; // 0 to 1
  waypoints: [number, number][];
}

interface LiveFleetMapProps {
  drivers: DeliveryStaff[];
  orders: Order[];
}

export function LiveFleetMap({ drivers, orders }: LiveFleetMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const polylineRef = useRef<{ [key: string]: any }>({});
  const customerMarkersRef = useRef<{ [key: string]: any }>({});

  const [isSimulating, setIsSimulating] = useState(true);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>('drv-001');
  const [mapStyle, setMapStyle] = useState<'streets' | 'osm' | 'satellite'>('streets');
  const tileLayerRef = useRef<any>(null);

  // Initial Real Nassau Simulation Telemetry for Couriers
  const [telemetry, setTelemetry] = useState<DriverTelemetry[]>([
    {
      driverId: 'drv-001',
      driverName: 'Malik Bethel',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      vehicleNumber: 'NP-8492',
      vehicleType: 'Electric Scooter',
      status: 'on_delivery',
      orderId: 'TG-104',
      customerName: 'Marcus Cole',
      customerAddress: 'West Bay St, Saunders Beach, Nassau',
      currentLat: NASSAU_STREET_ROUTE[Math.floor(NASSAU_STREET_ROUTE.length * 0.45)][0],
      currentLng: NASSAU_STREET_ROUTE[Math.floor(NASSAU_STREET_ROUTE.length * 0.45)][1],
      heading: 275,
      speedKmh: 31,
      batteryPct: 86,
      routeProgress: 0.45,
      waypoints: NASSAU_STREET_ROUTE,
    },
    {
      driverId: 'drv-002',
      driverName: 'Tariq Johnson',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      vehicleNumber: 'BS-9912',
      vehicleType: 'Motorcycle 150cc',
      status: 'on_delivery',
      orderId: 'TG-102',
      customerName: 'Elena Rostova',
      customerAddress: 'East Bay Street, Montagu Beach',
      currentLat: NASSAU_EAST_ROUTE[Math.floor(NASSAU_EAST_ROUTE.length * 0.50)][0],
      currentLng: NASSAU_EAST_ROUTE[Math.floor(NASSAU_EAST_ROUTE.length * 0.50)][1],
      heading: 85,
      speedKmh: 27,
      batteryPct: 92,
      routeProgress: 0.50,
      waypoints: NASSAU_EAST_ROUTE,
    },
    {
      driverId: 'drv-003',
      driverName: 'Davonte Moss',
      avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
      vehicleNumber: 'NP-1042',
      vehicleType: 'Electric Scooter',
      status: 'available',
      currentLat: NASSAU_PATROL_ROUTE[Math.floor(NASSAU_PATROL_ROUTE.length * 0.25)][0],
      currentLng: NASSAU_PATROL_ROUTE[Math.floor(NASSAU_PATROL_ROUTE.length * 0.25)][1],
      heading: 220,
      speedKmh: 18,
      batteryPct: 74,
      routeProgress: 0.25,
      waypoints: NASSAU_PATROL_ROUTE,
    },
  ]);

  // 1. Initialize Leaflet Map (Browser Only)
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;

      // Create Map Centered on Flagship Store
      const map = L.map(mapContainerRef.current, {
        center: STORE_LOCATION,
        zoom: 13,
        zoomControl: false,
      });

      // Zoom Control in top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Clean Esri World Street Map Tiles (100% Free, Zero Watermark, No API Key Required)
      const tileLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri, OpenStreetMap contributors',
          maxZoom: 19,
        }
      ).addTo(map);

      tileLayerRef.current = tileLayer;

      // 3.0-Mile Strict Delivery Boundary Circle
      const deliveryRadiusCircle = L.circle(STORE_LOCATION, {
        radius: DELIVERY_RADIUS_METERS,
        color: '#f59e0b',
        weight: 2,
        opacity: 0.7,
        fillColor: '#fbbf24',
        fillOpacity: 0.05,
        dashArray: '6, 8',
      }).addTo(map);

      deliveryRadiusCircle.bindTooltip('📍 3.0-Mile Delivery Dispatch Boundary (Bahamas Standard)', {
        permanent: false,
        direction: 'top',
        className: 'text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300 rounded-md p-1 shadow-sm',
      });

      // Fit initial bounds to include Store, 3-Mile Zone, and Waypoints
      const initialFramePoints: [number, number][] = [
        STORE_LOCATION,
        [STORE_LOCATION[0] + 0.025, STORE_LOCATION[1] - 0.045],
        [STORE_LOCATION[0] - 0.025, STORE_LOCATION[1] + 0.025],
        NASSAU_STREET_ROUTE[NASSAU_STREET_ROUTE.length - 1],
        NASSAU_EAST_ROUTE[NASSAU_EAST_ROUTE.length - 1],
      ];
      map.fitBounds(L.latLngBounds(initialFramePoints), {
        padding: [40, 40],
        maxZoom: 14,
      });

      // Store Flagship Marker
      const storeHtml = `
        <div class="relative flex flex-col items-center justify-center cursor-pointer group">
          <div class="w-10 h-10 rounded-2xl bg-amber-500 border-2 border-white shadow-xl flex items-center justify-center text-slate-950 font-black text-xs ring-4 ring-amber-400/30 transition-transform group-hover:scale-110">
            TG
          </div>
          <span class="mt-1 whitespace-nowrap bg-slate-950 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-lg border border-amber-400 flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            Tropical Gyros Flagship
          </span>
        </div>
      `;

      const storeIcon = L.divIcon({
        html: storeHtml,
        className: 'custom-store-pin',
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      L.marker(STORE_LOCATION, { icon: storeIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: system-ui; min-width: 220px; padding: 4px;">
            <div style="font-weight: 800; font-size: 14px; color: #0f172a;">Tropical Gyros Flagship</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Rosetta St & Mackey St, Palmdale, Nassau</div>
            <div style="font-size: 11px; color: #0284c7; margin-top: 2px; font-weight: 600;">📞 +1 (242) 462-6299</div>
            <div style="margin-top: 8px; font-size: 11px; font-weight: 700; color: #166534; background: #dcfce7; padding: 4px 8px; border-radius: 6px; display: inline-block;">
              🍗 Central Flagship Dispatch • 3-Mile Zone
            </div>
          </div>
        `);

      mapInstanceRef.current = map;
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle Map Style Switcher (Streets / OSM / Satellite)
  useEffect(() => {
    if (!tileLayerRef.current) return;

    let url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
    if (mapStyle === 'osm') {
      url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    } else if (mapStyle === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }

    tileLayerRef.current.setUrl(url);
  }, [mapStyle]);

  // 2. Render & Update Couriers Markers & Paths
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    import('leaflet').then((module) => {
      const L = module.default;
      const map = mapInstanceRef.current;
      if (!map) return;

      telemetry.forEach((courier) => {
        const markerKey = courier.driverId;
        const latLng: [number, number] = [courier.currentLat, courier.currentLng];

        const isDelivering = courier.status === 'on_delivery';
        const isSelected = courier.driverId === selectedDriverId;
        const isWestbound = courier.heading > 180 && courier.heading < 360;
        const banking = Math.min(14, Math.max(-14, Math.sin(courier.heading * Math.PI / 180) * 12));

        // 3D Isometric Courier Marker with Floating Info Pill
        const courierHtml = `
          <div class="relative cursor-pointer transition-transform duration-200 hover:scale-110 flex flex-col items-center">
            <!-- Speed Tag Pill -->
            <div class="whitespace-nowrap bg-slate-950/95 backdrop-blur-md text-white text-[9.5px] font-bold px-2 py-0.5 rounded-full shadow-xl border ${
              isSelected ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-slate-700/80'
            } mb-0.5 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full ${isDelivering ? 'bg-sky-400 animate-pulse' : 'bg-emerald-400'}"></span>
              <span class="text-slate-100 font-semibold">${courier.driverName.split(' ')[0]}</span>
              <span class="text-amber-400 font-mono text-[9px] font-extrabold">• ${courier.speedKmh} km/h</span>
            </div>

            <!-- 3D Isometric Scooter Asset (Cleaned, Upright, Soft Shadow) -->
            <div class="relative w-12 h-16 flex items-center justify-center filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.35)]">
              <img 
                src="/images/delivery_boy_3d.png" 
                alt="${courier.driverName}" 
                class="w-full h-full object-contain pointer-events-none transition-transform duration-300" 
                style="transform: scaleX(${isWestbound ? -1 : 1}) rotate(${banking}deg);" 
              />
            </div>
          </div>
        `;

        const courierIcon = L.divIcon({
          html: courierHtml,
          className: 'custom-driver-pin',
          iconSize: [56, 76],
          iconAnchor: [28, 38],
        });

        // Update or Create Marker
        if (markersRef.current[markerKey]) {
          markersRef.current[markerKey].setLatLng(latLng);
          markersRef.current[markerKey].setIcon(courierIcon);
        } else {
          const marker = L.marker(latLng, { icon: courierIcon }).addTo(map);
          marker.on('click', () => {
            setSelectedDriverId(courier.driverId);
          });
          markersRef.current[markerKey] = marker;
        }

        // Draw Real Street-Snapped Route Line (Solid Vibrant Blue like Google Maps)
        if (isDelivering && courier.waypoints.length > 1) {
          const polylineKey = `poly-${courier.driverId}`;
          if (polylineRef.current[polylineKey]) {
            polylineRef.current[polylineKey].setLatLngs(courier.waypoints);
          } else {
            // High-def road polyline with glow
            const poly = L.polyline(courier.waypoints, {
              color: '#1e88e5',
              weight: 5,
              opacity: 0.9,
              lineCap: 'round',
              lineJoin: 'round',
            }).addTo(map);
            polylineRef.current[polylineKey] = poly;
          }

          // Customer Destination Doorstep Home Pin
          const customerKey = `cust-${courier.driverId}`;
          const destCoord = courier.waypoints[courier.waypoints.length - 1];

          if (customerMarkersRef.current[customerKey] && destCoord) {
            customerMarkersRef.current[customerKey].setLatLng(destCoord);
          } else if (destCoord) {
            const customerHtml = `
              <div class="relative flex flex-col items-center justify-center cursor-pointer group">
                <div class="w-8 h-8 rounded-full bg-slate-900 border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs">
                  🏠
                </div>
                <span class="mt-0.5 whitespace-nowrap bg-white text-slate-900 text-[9px] font-bold px-2 py-0.5 rounded shadow border border-slate-200">
                  ${courier.customerName || 'Customer'}
                </span>
              </div>
            `;
            const custIcon = L.divIcon({
              html: customerHtml,
              className: 'custom-cust-pin',
              iconSize: [36, 42],
              iconAnchor: [18, 21],
            });

            const custMarker = L.marker(destCoord, { icon: custIcon }).addTo(map);
            custMarker.bindPopup(`
              <div style="font-family: system-ui; min-width: 170px;">
                <div style="font-weight: 800; font-size: 12px; color: #0f172a;">${courier.customerName}</div>
                <div style="font-size: 11px; color: #64748b;">${courier.customerAddress}</div>
                <div style="margin-top: 4px; font-size: 10px; font-weight: bold; color: #0284c7;">
                  Order #${courier.orderId} • Delivering
                </div>
              </div>
            `);
            customerMarkersRef.current[customerKey] = custMarker;
          }
        }
      });
    });
  }, [telemetry, selectedDriverId]);

  // 3. Live Simulation Ticker (Simulates live GPS movements on Nassau roads)
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setTelemetry((prev) =>
        prev.map((driver) => {
          if (driver.status === 'offline') return driver;

          // Increment route progress slightly along waypoints
          let newProgress = driver.routeProgress + 0.015;
          if (newProgress > 0.95) newProgress = 0.05; // Loop back for perpetual live demo

          const totalSegments = driver.waypoints.length - 1;
          const segmentIndex = Math.min(
            Math.floor(newProgress * totalSegments),
            totalSegments - 1
          );
          const segmentProgress = (newProgress * totalSegments) - segmentIndex;

          const p1 = driver.waypoints[segmentIndex];
          const p2 = driver.waypoints[segmentIndex + 1];

          const newLat = p1[0] + (p2[0] - p1[0]) * segmentProgress;
          const newLng = p1[1] + (p2[1] - p1[1]) * segmentProgress;

          // Dynamic heading based on movement vector
          const dLng = p2[1] - p1[1];
          const dLat = p2[0] - p1[0];
          const calculatedHeading = (Math.atan2(dLng, dLat) * 180 / Math.PI + 360) % 360;

          // Add realistic GPS noise & speed fluctuation
          const speedVariance = (Math.random() - 0.5) * 3;
          const newSpeed = Math.max(16, Math.min(38, Math.round(driver.speedKmh + speedVariance)));

          return {
            ...driver,
            routeProgress: newProgress,
            currentLat: Number(newLat.toFixed(6)),
            currentLng: Number(newLng.toFixed(6)),
            heading: Math.round(calculatedHeading),
            speedKmh: newSpeed,
          };
        })
      );
    }, 1800);

    return () => clearInterval(interval);
  }, [isSimulating]);

  const selectedDriver = telemetry.find((d) => d.driverId === selectedDriverId) || telemetry[0];

  const handleFocusCourier = (courier: DriverTelemetry) => {
    setSelectedDriverId(courier.driverId);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([courier.currentLat, courier.currentLng], 15, {
        duration: 1.2,
      });
    }
  };

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(STORE_LOCATION, 13, { duration: 1 });
    }
  };

  const handleFitAllCouriers = () => {
    if (!mapInstanceRef.current) return;
    import('leaflet').then((module) => {
      const L = module.default;
      const points: [number, number][] = [
        STORE_LOCATION,
        ...telemetry.map((t) => [t.currentLat, t.currentLng] as [number, number]),
        ...telemetry
          .filter((t) => t.status === 'on_delivery' && t.waypoints.length > 0)
          .map((t) => t.waypoints[t.waypoints.length - 1]),
      ];
      const bounds = L.latLngBounds(points);
      mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    });
  };

  return (
    <div className="space-y-4">
      {/* Map Control Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-bold px-3 py-1 flex items-center gap-1.5 shadow-2xs">
            <Compass className="w-3.5 h-3.5 text-amber-700 animate-spin" />
            Nassau, Bahamas Fleet Radar
          </Badge>

          <span className="text-xs text-slate-500 font-medium">
            3.0-Mile Dispatch Radius • OpenStreetMap & Esri Engine
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          {/* Map Layer Switcher: 100% Free, Zero Watermark */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setMapStyle('streets')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                mapStyle === 'streets'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🧭 Clean Streets
            </button>
            <button
              type="button"
              onClick={() => setMapStyle('osm')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                mapStyle === 'osm'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🗺️ OpenStreetMap
            </button>
            <button
              type="button"
              onClick={() => setMapStyle('satellite')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                mapStyle === 'satellite'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🛰️ Satellite
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleFitAllCouriers}
            className="text-xs font-semibold cursor-pointer"
          >
            <Crosshair className="w-3.5 h-3.5 mr-1 text-slate-600" />
            Fit All Couriers
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleResetView}
            className="text-xs font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1 text-slate-600" />
            Center Store
          </Button>

          <Button
            size="sm"
            onClick={() => setIsSimulating(!isSimulating)}
            className={`cursor-pointer ${
              isSimulating
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs'
                : 'bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs'
            }`}
          >
            {isSimulating ? (
              <>
                <Pause className="w-3.5 h-3.5 mr-1" /> Live Stream Active
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 mr-1" /> Resume Live Stream
              </>
            )}
          </Button>I 
        </div>
      </div>

      {/* Main Map + Live Telemetry Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
        {/* Left 3 Columns: Interactive Leaflet Map Container */}
        <div className="lg:col-span-3 rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm bg-slate-100 relative h-[620px] isolate">
          <div ref={mapContainerRef} className="absolute inset-0 z-0 w-full h-full" />

          {/* Top-Left Floating Map Overlay Badge */}
          <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-md flex items-center gap-2 text-xs font-bold text-slate-800 pointer-events-none">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Live GPS Telemetry</span>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-700 font-bold">{telemetry.filter(t => t.status === 'on_delivery').length} In Transit</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 font-medium">{telemetry.filter(t => t.status === 'available').length} Available</span>
          </div>

          {/* Bottom-Left Floating Operational Radius Badge */}
          <div className="absolute bottom-3 left-3 z-10 bg-slate-950/90 backdrop-blur-md text-white text-[11px] font-medium px-3 py-1.5 rounded-xl shadow-lg border border-slate-800 flex items-center gap-2 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>3.0-Mile Operational Dispatch Radius (Bahamas Standard)</span>
          </div>
        </div>

        {/* Right 1 Column: Active Courier Telemetry Cards */}
        <div className="h-[620px] flex flex-col bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-extrabold text-slate-900 tracking-tight block">
                Active Couriers Telemetry
              </span>
              <span className="text-[10px] text-slate-400">
                {telemetry.filter(t => t.status === 'on_delivery').length} Delivering • {telemetry.filter(t => t.status === 'available').length} Available
              </span>
            </div>
            <Badge className="bg-sky-50 text-sky-700 border-sky-200 font-bold text-[10px]">
              {telemetry.length} Couriers
            </Badge>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pt-3 pr-1">
            {telemetry.map((courier) => {
              const isSelected = courier.driverId === selectedDriverId;
              const isDelivering = courier.status === 'on_delivery';

              return (
                <div
                  key={courier.driverId}
                  onClick={() => handleFocusCourier(courier)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-50/80 border-amber-400 shadow-sm ring-1 ring-amber-400'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <img
                        src={courier.avatarUrl}
                        alt={courier.driverName}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                          isDelivering ? 'bg-sky-500' : 'bg-emerald-500'
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-xs text-slate-900 truncate">
                          {courier.driverName}
                        </p>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {courier.vehicleNumber}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {courier.vehicleType}
                      </p>
                    </div>
                  </div>

                  {/* Telemetry Stats Bar */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 grid grid-cols-3 gap-1 text-center">
                    <div className="bg-slate-50 p-1.5 rounded-lg">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Speed</span>
                      <span className="text-xs font-extrabold text-slate-800">
                        {courier.speedKmh} km/h
                      </span>
                    </div>

                    <div className="bg-slate-50 p-1.5 rounded-lg">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Battery</span>
                      <span className="text-xs font-extrabold text-emerald-700 flex items-center justify-center gap-0.5">
                        <Zap className="w-2.5 h-2.5" />
                        {courier.batteryPct}%
                      </span>
                    </div>

                    <div className="bg-slate-50 p-1.5 rounded-lg">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Status</span>
                      <span className={`text-[10px] font-bold ${isDelivering ? 'text-sky-700' : 'text-emerald-700'}`}>
                        {isDelivering ? 'Delivering' : 'Available'}
                      </span>
                    </div>
                  </div>

                  {/* Active Order Details if On Delivery */}
                  {isDelivering && (
                    <div className="mt-2.5 p-2 bg-sky-50/70 border border-sky-100 rounded-lg text-[11px] space-y-1">
                      <div className="flex items-center justify-between font-bold text-sky-950">
                        <span>Order #{courier.orderId}</span>
                        <span className="text-[9.5px] text-sky-700 font-semibold bg-sky-100/70 px-1.5 py-0.5 rounded">En Route</span>
                      </div>
                      <p className="text-slate-700 text-[10px] font-medium truncate">
                        👤 {courier.customerName}
                      </p>
                      <p className="text-slate-500 text-[10px] truncate">
                        📍 {courier.customerAddress}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
