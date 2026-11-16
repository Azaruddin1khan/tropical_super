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
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DeliveryStaff, Order } from '@/types';
import { NASSAU_STREET_ROUTE } from '@/data/nassau-route';
import 'leaflet/dist/leaflet.css';

// Nassau, Bahamas Key Coordinates
const STORE_LOCATION: [number, number] = [25.0478, -77.3554]; // Tropical Gyros Store (Bay St, Nassau)
const DELIVERY_RADIUS_METERS = 4828; // Strict 3.0-mile boundary

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
      customerAddress: 'West Bay St, Cable Beach, Nassau',
      currentLat: 25.0610,
      currentLng: -77.3820,
      heading: 295,
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
      customerAddress: 'East Bay Street, Nassau Harbour',
      currentLat: 25.0440,
      currentLng: -77.3320,
      heading: 105,
      speedKmh: 27,
      batteryPct: 92,
      routeProgress: 0.65,
      waypoints: [
        [25.0478, -77.3554], // Store
        [25.0460, -77.3450],
        [25.0440, -77.3320], // Current
        [25.0420, -77.3190], // Customer Destination
      ],
    },
    {
      driverId: 'drv-003',
      driverName: 'Davonte Moss',
      avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
      vehicleNumber: 'NP-1042',
      vehicleType: 'Electric Scooter',
      status: 'available',
      currentLat: 25.0495,
      currentLng: -77.3585,
      heading: 140,
      speedKmh: 14,
      batteryPct: 68,
      routeProgress: 0.85,
      waypoints: [
        [25.0560, -77.3690],
        [25.0495, -77.3585], // Returning to Store
        [25.0478, -77.3554], // Store
      ],
    },
  ]);

  // 1. Initialize Leaflet Map (Browser Only)
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = (await import('leaflet')).default;

      if (!isMounted || !mapContainerRef.current) return;

      // Create Map Centered on Nassau
      const map = L.map(mapContainerRef.current, {
        center: STORE_LOCATION,
        zoom: 13,
        zoomControl: false,
      });

      // Zoom Control in top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Clean High-Def Road Tiles (100% Free, Zero Watermark, No API Key Required)
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
        opacity: 0.8,
        fillColor: '#fbbf24',
        fillOpacity: 0.07,
        dashArray: '6, 8',
      }).addTo(map);

      deliveryRadiusCircle.bindTooltip('📍 3.0-Mile Delivery Dispatch Boundary (Bahamas Standard)', {
        permanent: false,
        direction: 'top',
        className: 'text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300 rounded-md p-1',
      });

      // Store Flagship Marker
      const storeHtml = `
        <div class="relative flex items-center justify-center">
          <div class="w-10 h-10 rounded-2xl bg-amber-500 border-2 border-white shadow-lg flex items-center justify-center text-slate-950 font-black text-xs animate-bounce">
            TG
          </div>
          <span class="absolute -bottom-5 whitespace-nowrap bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md border border-amber-400">
            Tropical Gyros Flagship
          </span>
        </div>
      `;

      const storeIcon = L.divIcon({
        html: storeHtml,
        className: 'custom-store-pin',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      L.marker(STORE_LOCATION, { icon: storeIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: system-ui; min-width: 180px;">
            <div style="font-weight: 800; font-size: 13px; color: #0f172a;">Tropical Gyros Store</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Bay St & Parliament St, Nassau</div>
            <div style="margin-top: 6px; font-size: 10px; font-weight: 700; color: #166534; background: #dcfce7; padding: 2px 6px; border-radius: 4px; display: inline-block;">
              Kitchen Dispatch Active
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

        // Status Badge color
        const isDelivering = courier.status === 'on_delivery';
        const ringColor = isDelivering ? '#0284c7' : '#10b981';
        const pulseAnim = isDelivering ? 'animate-pulse' : '';

        const courierHtml = `
          <div class="relative cursor-pointer transition-transform hover:scale-110">
            <div class="w-10 h-10 rounded-full bg-white border-2 shadow-xl flex items-center justify-center overflow-hidden" style="border-color: ${ringColor}">
              <img src="${courier.avatarUrl}" class="w-full h-full object-cover" />
            </div>
            <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-900 border border-white flex items-center justify-center text-[9px] text-white ${pulseAnim}">
              🛵
            </div>
            <div class="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/90 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
              ${courier.driverName.split(' ')[0]} • ${courier.speedKmh} km/h
            </div>
          </div>
        `;

        const courierIcon = L.divIcon({
          html: courierHtml,
          className: 'custom-driver-pin',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
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

        // Draw Route Line if on delivery
        if (isDelivering && courier.waypoints.length > 1) {
          const polylineKey = `poly-${courier.driverId}`;
          if (polylineRef.current[polylineKey]) {
            polylineRef.current[polylineKey].setLatLngs(courier.waypoints);
          } else {
            const poly = L.polyline(courier.waypoints, {
              color: ringColor,
              weight: 4,
              opacity: 0.7,
              dashArray: '4, 8',
            }).addTo(map);
            polylineRef.current[polylineKey] = poly;
          }
        }
      });
    });
  }, [telemetry]);

  // 3. Live Simulation Ticker (Simulates live GPS movements on Nassau roads)
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setTelemetry((prev) =>
        prev.map((driver) => {
          if (driver.status === 'offline') return driver;

          // Increment route progress slightly
          let newProgress = driver.routeProgress + 0.02;
          if (newProgress > 0.95) newProgress = 0.1; // Loop back for perpetual live demo

          // Calculate interpolated point between waypoints
          const totalSegments = driver.waypoints.length - 1;
          const segmentIndex = Math.min(
            Math.floor(newProgress * totalSegments),
            totalSegments - 1
          );
          const segmentProgress =
            (newProgress * totalSegments) - segmentIndex;

          const p1 = driver.waypoints[segmentIndex];
          const p2 = driver.waypoints[segmentIndex + 1];

          const newLat = p1[0] + (p2[0] - p1[0]) * segmentProgress;
          const newLng = p1[1] + (p2[1] - p1[1]) * segmentProgress;

          // Add realistic GPS noise & speed fluctuation
          const speedVariance = (Math.random() - 0.5) * 4;
          const newSpeed = Math.max(15, Math.min(42, Math.round(driver.speedKmh + speedVariance)));

          return {
            ...driver,
            routeProgress: newProgress,
            currentLat: Number(newLat.toFixed(5)),
            currentLng: Number(newLng.toFixed(5)),
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

  return (
    <div className="space-y-4">
      {/* Map Control Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-bold px-2.5 py-1">
            <Compass className="w-3.5 h-3.5 mr-1 text-amber-700 animate-spin" />
            Nassau, Bahamas Fleet Radar
          </Badge>

          <span className="text-xs text-slate-500 font-medium">
            3.0-Mile Operational Radius • OpenStreetMap & Leaflet Engine
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
            onClick={handleResetView}
            className="text-xs font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Center Store
          </Button>

          <Button
            size="sm"
            onClick={() => setIsSimulating(!isSimulating)}
            className={isSimulating ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs' : 'bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs'}
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
          </Button>
        </div>
      </div>

      {/* Main Map + Live Telemetry Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left 3 Columns: Interactive Leaflet Map Container */}
        <div className="lg:col-span-3 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 relative min-h-[480px] lg:min-h-[580px]">
          <div ref={mapContainerRef} className="absolute inset-0 z-0 w-full h-full" />

          {/* Map Overlay Badge */}
          <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2 text-xs font-bold text-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Live GPS Telemetry</span>
            <span className="text-slate-400 font-normal">|</span>
            <span className="text-emerald-700 font-semibold">{telemetry.filter(t => t.status === 'on_delivery').length} In Transit</span>
          </div>
        </div>

        {/* Right 1 Column: Active Courier Telemetry Cards */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            Active Couriers Telemetry ({telemetry.length})
          </div>

          <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
            {telemetry.map((courier) => {
              const isSelected = courier.driverId === selectedDriverId;
              const isDelivering = courier.status === 'on_delivery';

              return (
                <div
                  key={courier.driverId}
                  onClick={() => handleFocusCourier(courier)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
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
                        <p className="font-bold text-sm text-slate-900 truncate">
                          {courier.driverName}
                        </p>
                        <span className="text-[10px] font-bold text-slate-500">
                          {courier.vehicleNumber}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 truncate">
                        {courier.vehicleType}
                      </p>
                    </div>
                  </div>

                  {/* Telemetry Stats Bar */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-3 gap-1 text-center">
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
                        <span className="text-[10px] text-sky-700 font-semibold">En Route</span>
                      </div>
                      <p className="text-slate-600 text-[10px] truncate">
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

