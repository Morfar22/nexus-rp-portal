import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, 
  Users, 
  Server, 
  Activity,
  Settings,
  RefreshCw,
  Eye,
  EyeOff,
  Zap
} from "lucide-react";

interface ServerLocation {
  id: string;
  name: string;
  coordinates: [number, number];
  playerCount: number;
  maxPlayers: number;
  status: 'online' | 'offline' | 'maintenance';
  description: string;
  region: string;
}

interface PlayerLocation {
  id: string;
  name: string;
  coordinates: [number, number];
  lastSeen: string;
  vehicle?: string;
  job: 'police' | 'ems' | 'civilian' | 'mechanic' | 'taxi' | 'admin';
  jobGrade?: string;
  status: 'online' | 'idle' | 'busy' | 'off-duty';
  heading?: number;
  serverId: string;
}

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [isTokenSet, setIsTokenSet] = useState(false);
  const [servers, setServers] = useState<ServerLocation[]>([]);
  const [players, setPlayers] = useState<PlayerLocation[]>([]);
  const [showPlayers, setShowPlayers] = useState(true);
  const [showServers, setShowServers] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const { toast } = useToast();

  // Mock FiveM RP server data - Los Santos coordinates
  const mockServers: ServerLocation[] = [
    {
      id: '1',
      name: 'Dreamlight RP - Main',
      coordinates: [-118.2437, 34.0522], // Los Santos (Los Angeles coords)
      playerCount: 156,
      maxPlayers: 200,
      status: 'online',
      description: 'Main FiveM RP server - Los Santos',
      region: 'US West'
    }
  ];

  // Mock FiveM player data with jobs - Los Santos locations
  const mockPlayers: PlayerLocation[] = [
    // Police Officers
    {
      id: 'police1',
      name: 'Officer Johnson',
      coordinates: [-118.2437, 34.0522], // Mission Row PD
      lastSeen: new Date().toISOString(),
      vehicle: 'Police Cruiser',
      job: 'police',
      jobGrade: 'Officer',
      status: 'online',
      heading: 45,
      serverId: '1'
    },
    {
      id: 'police2',
      name: 'Sgt. Williams',
      coordinates: [-118.2490, 34.0580], // Vinewood PD
      lastSeen: new Date().toISOString(),
      vehicle: 'Police SUV',
      job: 'police',
      jobGrade: 'Sergeant',
      status: 'busy',
      heading: 180,
      serverId: '1'
    },
    // EMS/Paramedics
    {
      id: 'ems1',
      name: 'Dr. Smith',
      coordinates: [-118.2300, 34.0600], // Pillbox Medical
      lastSeen: new Date().toISOString(),
      vehicle: 'Ambulance',
      job: 'ems',
      jobGrade: 'Paramedic',
      status: 'online',
      heading: 90,
      serverId: '1'
    },
    {
      id: 'ems2',
      name: 'Nurse Davis',
      coordinates: [-118.2320, 34.0610], // Near Hospital
      lastSeen: new Date().toISOString(),
      job: 'ems',
      jobGrade: 'EMT',
      status: 'idle',
      serverId: '1'
    },
    // Civilians
    {
      id: 'civ1',
      name: 'John Doe',
      coordinates: [-118.2000, 34.0400], // Sandy Shores
      lastSeen: new Date().toISOString(),
      vehicle: 'Personal Car',
      job: 'civilian',
      status: 'online',
      heading: 270,
      serverId: '1'
    },
    {
      id: 'civ2',
      name: 'Jane Smith',
      coordinates: [-118.1900, 34.0500], // Paleto Bay
      lastSeen: new Date().toISOString(),
      job: 'civilian',
      status: 'idle',
      serverId: '1'
    },
    // Mechanics
    {
      id: 'mech1',
      name: 'Tony Wrench',
      coordinates: [-118.2600, 34.0300], // Auto Shop
      lastSeen: new Date().toISOString(),
      vehicle: 'Tow Truck',
      job: 'mechanic',
      jobGrade: 'Mechanic',
      status: 'busy',
      heading: 135,
      serverId: '1'
    }
  ];

  useEffect(() => {
    // Try to get Mapbox token from environment/secrets
    const initializeMap = async () => {
      try {
        // For production, this would come from Supabase secrets
        // For demo, we'll use a token input
        const storedToken = localStorage.getItem('mapbox_token');
        if (storedToken) {
          setMapboxToken(storedToken);
          setIsTokenSet(true);
          initMap(storedToken);
        }
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initializeMap();
    setServers(mockServers);
    setPlayers(mockPlayers);
  }, []);

  useEffect(() => {
    if (autoRefresh && isTokenSet) {
      const interval = setInterval(() => {
        fetchLiveData();
      }, refreshInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, isTokenSet]);

  const initMap = (token: string) => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      projection: 'mercator', // Better for city-level maps
      zoom: 10, // Zoom to city level for Los Santos
      center: [-118.2437, 34.0522], // Los Santos center
      pitch: 0,
      bearing: 0
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add fullscreen control
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    // Set up atmosphere
    map.current.on('style.load', () => {
      map.current?.setFog({
        color: 'rgb(20, 20, 30)',
        'high-color': 'rgb(40, 40, 60)',
        'horizon-blend': 0.1,
      });

      // Add custom sources and layers for servers and players
      addServerMarkers();
      addPlayerMarkers();
    });
  };

  const addServerMarkers = () => {
    if (!map.current) return;

    servers.forEach((server) => {
      const statusColor = server.status === 'online' ? '#10b981' : 
                         server.status === 'offline' ? '#ef4444' : '#f59e0b';
      
      // Create custom marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'server-marker';
      markerElement.style.cssText = `
        width: 30px;
        height: 30px;
        background-color: ${statusColor};
        border: 3px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        position: relative;
      `;

      // Add pulse animation for online servers
      if (server.status === 'online') {
        markerElement.style.animation = 'pulse 2s infinite';
      }

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="color: #333; font-family: sans-serif;">
          <h3 style="margin: 0 0 10px 0; color: ${statusColor};">${server.name}</h3>
          <p style="margin: 5px 0;"><strong>Status:</strong> ${server.status.toUpperCase()}</p>
          <p style="margin: 5px 0;"><strong>Players:</strong> ${server.playerCount}/${server.maxPlayers}</p>
          <p style="margin: 5px 0;"><strong>Region:</strong> ${server.region}</p>
          <p style="margin: 5px 0; font-size: 12px;">${server.description}</p>
        </div>
      `);

      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat(server.coordinates)
        .setPopup(popup)
        .addTo(map.current!);
    });

    // Add pulse animation CSS
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.2); opacity: 0.8; }
        100% { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  };

  const addPlayerMarkers = () => {
    if (!map.current || !showPlayers) return;

    // Get job colors and icons
    const getJobStyle = (job: string) => {
      switch (job) {
        case 'police':
          return { color: '#3B82F6', icon: '🚔', label: 'Police' };
        case 'ems':
          return { color: '#EF4444', icon: '🚑', label: 'EMS' };
        case 'mechanic':
          return { color: '#F59E0B', icon: '🔧', label: 'Mechanic' };
        case 'taxi':
          return { color: '#FBBF24', icon: '🚕', label: 'Taxi' };
        case 'admin':
          return { color: '#8B5CF6', icon: '👑', label: 'Admin' };
        default:
          return { color: '#10B981', icon: '👤', label: 'Civilian' };
      }
    };

    players.forEach((player) => {
      const jobStyle = getJobStyle(player.job);
      const statusOpacity = player.status === 'online' ? '1' : 
                           player.status === 'busy' ? '0.8' : '0.6';
      
      const markerElement = document.createElement('div');
      markerElement.className = 'player-marker';
      markerElement.innerHTML = jobStyle.icon;
      markerElement.style.cssText = `
        width: 24px;
        height: 24px;
        background-color: ${jobStyle.color};
        border: 2px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        opacity: ${statusOpacity};
        transition: all 0.2s ease;
        ${player.heading ? `transform: rotate(${player.heading}deg);` : ''}
      `;

      // Add pulse for busy status
      if (player.status === 'busy') {
        markerElement.style.animation = 'pulse 1.5s infinite';
      }

      const popup = new mapboxgl.Popup({ offset: 15 }).setHTML(`
        <div style="color: #333; font-family: sans-serif; min-width: 200px;">
          <h4 style="margin: 0 0 8px 0; color: ${jobStyle.color};">
            ${jobStyle.icon} ${player.name}
          </h4>
          <p style="margin: 3px 0;"><strong>Job:</strong> ${jobStyle.label}${player.jobGrade ? ` (${player.jobGrade})` : ''}</p>
          <p style="margin: 3px 0;"><strong>Status:</strong> 
            <span style="color: ${player.status === 'online' ? '#10B981' : player.status === 'busy' ? '#F59E0B' : '#6B7280'}">
              ${player.status.toUpperCase()}
            </span>
          </p>
          ${player.vehicle ? `<p style="margin: 3px 0;"><strong>Vehicle:</strong> ${player.vehicle}</p>` : ''}
          <p style="margin: 3px 0; font-size: 11px;"><strong>Last seen:</strong> ${new Date(player.lastSeen).toLocaleTimeString()}</p>
          <p style="margin: 3px 0; font-size: 11px;"><strong>Server:</strong> ${servers.find(s => s.id === player.serverId)?.name || 'Unknown'}</p>
        </div>
      `);

      new mapboxgl.Marker(markerElement)
        .setLngLat(player.coordinates)
        .setPopup(popup)
        .addTo(map.current!);
    });
  };

  const handleTokenSubmit = () => {
    if (!mapboxToken.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid Mapbox token",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem('mapbox_token', mapboxToken);
    setIsTokenSet(true);
    initMap(mapboxToken);
    
    toast({
      title: "Success",
      description: "Map initialized successfully!",
    });
  };

  const fetchLiveData = async () => {
    try {
      console.log('Fetching live FiveM data...');
      
      // Call our edge function to get real server data
      const { data, error } = await supabase.functions.invoke('fetch-fivem-data');
      
      if (error) {
        console.error('Error fetching FiveM data:', error);
        toast({
          title: "Connection Error",
          description: "Failed to fetch live server data. Using cached data.",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        console.log('Received FiveM data:', data);
        setServers(data.servers || []);
        setPlayers(data.players || []);
        
        // Update markers on map
        if (map.current) {
          // Clear existing markers
          const markers = document.querySelectorAll('.server-marker, .player-marker');
          markers.forEach(marker => marker.remove());
          
          // Re-add markers with new data
          addServerMarkers();
          if (showPlayers) addPlayerMarkers();
        }
        
        toast({
          title: "Data Updated",
          description: `Updated ${data.players?.length || 0} player locations`,
        });
      }
    } catch (error) {
      console.error('Error fetching live data:', error);
      
      // Fallback to mock data simulation for demo
      setPlayers(prevPlayers => 
        prevPlayers.map(player => ({
          ...player,
          coordinates: [
            player.coordinates[0] + (Math.random() - 0.5) * 0.002, // Smaller movement for city-level
            player.coordinates[1] + (Math.random() - 0.5) * 0.002
          ] as [number, number],
          lastSeen: new Date().toISOString(),
          status: Math.random() > 0.7 ? 'busy' : 'online' // Random status changes
        }))
      );

      // Refresh markers with simulated data
      if (map.current) {
        const markers = document.querySelectorAll('.player-marker');
        markers.forEach(marker => marker.remove());
        if (showPlayers) addPlayerMarkers();
      }
    }
  };

  const refreshMap = () => {
    if (map.current) {
      // Clear existing markers
      const markers = document.querySelectorAll('.server-marker, .player-marker');
      markers.forEach(marker => marker.remove());
      
      // Re-add markers
      addServerMarkers();
      if (showPlayers) addPlayerMarkers();
    }
    fetchLiveData();
  };

  const connectToFiveMServer = async (serverIp: string, serverPort: number) => {
    try {
      toast({
        title: "Connecting to FiveM Server",
        description: `Attempting to connect to ${serverIp}:${serverPort}`,
      });
      
      await fetchLiveData();
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Could not connect to FiveM server. Check server IP and port.",
        variant: "destructive",
      });
    }
  };

  if (!isTokenSet) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto p-6 bg-gaming-card border-gaming-border">
            <div className="text-center mb-6">
              <MapPin className="h-12 w-12 text-neon-purple mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Live Server Map</h2>
              <p className="text-muted-foreground">Enter your Mapbox token to view the interactive map</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-foreground">Mapbox Public Token</Label>
                <Input
                  type="password"
                  value={mapboxToken}
                  onChange={(e) => setMapboxToken(e.target.value)}
                  placeholder="pk.eyJ1IjoieW91cnVzZXJuYW1lIi..."
                  className="bg-gaming-dark border-gaming-border text-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Get your token from <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-neon-purple hover:underline">mapbox.com</a>
                </p>
              </div>
              
              <Button onClick={handleTokenSubmit} className="w-full" variant="neon">
                Initialize Map
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      
      {/* Map Controls */}
      <div className="absolute top-20 left-4 z-10 space-y-2">
        <Card className="p-4 bg-gaming-card/90 border-gaming-border backdrop-blur-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="h-5 w-5 text-neon-purple" />
            <h3 className="text-lg font-semibold text-foreground">Live Map Controls</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-foreground text-sm">Show Servers</Label>
              <Switch
                checked={showServers}
                onCheckedChange={setShowServers}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label className="text-foreground text-sm">Show Players</Label>
              <Switch
                checked={showPlayers}
                onCheckedChange={setShowPlayers}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label className="text-foreground text-sm">Auto Refresh</Label>
              <Switch
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
            </div>
            
            {autoRefresh && (
              <div>
                <Label className="text-foreground text-sm">Refresh Interval (seconds)</Label>
                <Input
                  type="number"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(parseInt(e.target.value) || 30)}
                  min="10"
                  max="300"
                  className="bg-gaming-dark border-gaming-border text-foreground text-sm"
                />
              </div>
            )}
            
            <Button onClick={refreshMap} size="sm" variant="outline" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Now
            </Button>
          </div>
        </Card>
      </div>

      {/* Map Legend */}
      <div className="absolute top-20 right-4 z-10">
        <Card className="p-4 bg-gaming-card/90 border-gaming-border backdrop-blur-sm">
          <h4 className="text-sm font-semibold text-foreground mb-3">Legend</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              <span className="text-foreground">Server Online</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full border-2 border-white"></div>
              <span className="text-foreground">Server Maintenance</span>
            </div>
            <hr className="border-gaming-border my-2" />
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-xs">🚔</div>
              <span className="text-foreground">Police</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-xs">🚑</div>
              <span className="text-foreground">EMS/Paramedic</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center text-xs">🔧</div>
              <span className="text-foreground">Mechanic</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-xs">👤</div>
              <span className="text-foreground">Civilian</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-purple-500 rounded-full border-2 border-white flex items-center justify-center text-xs">👑</div>
              <span className="text-foreground">Admin</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Server Stats */}
      <div className="absolute bottom-4 left-4 z-10">
        <Card className="p-4 bg-gaming-card/90 border-gaming-border backdrop-blur-sm">
          <div className="flex items-center space-x-2 mb-3">
            <Server className="h-5 w-5 text-neon-purple" />
            <h4 className="text-sm font-semibold text-foreground">Server Status</h4>
          </div>
          <div className="space-y-2">
            {servers.map((server) => (
              <div key={server.id} className="flex items-center justify-between text-xs">
                <span className="text-foreground">{server.name}</span>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant="outline" 
                    className={
                      server.status === 'online' 
                        ? "border-green-500 text-green-500" 
                        : server.status === 'offline'
                        ? "border-red-500 text-red-500"
                        : "border-yellow-500 text-yellow-500"
                    }
                  >
                    {server.playerCount}/{server.maxPlayers}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-screen" />
    </div>
  );
};

export default Map;