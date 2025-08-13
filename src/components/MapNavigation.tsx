import React, { useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { DivIcon, LatLngBounds } from 'leaflet';
import { theme } from '../styles/theme';
import type { Location } from '../../types/trivia';
import 'leaflet/dist/leaflet.css';

interface MapNavigationProps {
  currentLocation: Location;
  visitedLocations: Location[];
  onLocationSelect?: (location: Location) => void;
  showMiniMap?: boolean;
  className?: string;
}

const MapWrapper = styled(motion.div)<{ showMiniMap: boolean }>`
  width: ${({ showMiniMap }) => showMiniMap ? '300px' : '100%'};
  height: ${({ showMiniMap }) => showMiniMap ? '200px' : '400px'};
  border-radius: ${theme.borderRadius.xl};
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: ${theme.shadows.xl};
  backdrop-filter: blur(10px);
  
  @media (max-width: ${theme.breakpoints.md}) {
    width: ${({ showMiniMap }) => showMiniMap ? '250px' : '100%'};
    height: ${({ showMiniMap }) => showMiniMap ? '150px' : '300px'};
  }
  
  .leaflet-container {
    width: 100%;
    height: 100%;
    background: ${theme.colors.background.dark};
  }
  
  .leaflet-control-zoom {
    border: none;
    border-radius: ${theme.borderRadius.lg};
    box-shadow: ${theme.shadows.md};
  }
  
  .leaflet-control-zoom a {
    background: rgba(255, 255, 255, 0.9);
    color: ${theme.colors.text.primary};
    border-radius: ${theme.borderRadius.md};
    
    &:hover {
      background: rgba(255, 255, 255, 1);
    }
  }
`;

const StyledMapContainer = styled(MapContainer)`
  width: 100%;
  height: 100%;
  z-index: 1;
`;

const LocationInfo = styled(motion.div)`
  position: absolute;
  top: ${theme.spacing[4]};
  left: ${theme.spacing[4]};
  right: ${theme.spacing[4]};
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing[3]};
  box-shadow: ${theme.shadows.md};
  z-index: 1000;
  
  @media (max-width: ${theme.breakpoints.md}) {
    top: ${theme.spacing[2]};
    left: ${theme.spacing[2]};
    right: ${theme.spacing[2]};
    padding: ${theme.spacing[2]};
  }
`;

const LocationName = styled.h4`
  font-family: ${theme.typography.fonts.secondary};
  font-size: ${theme.typography.sizes.lg};
  font-weight: ${theme.typography.weights.bold};
  color: ${theme.colors.text.primary};
  margin: 0 0 ${theme.spacing[1]} 0;
`;

const LocationCoords = styled.div`
  font-family: ${theme.typography.fonts.mono};
  font-size: ${theme.typography.sizes.xs};
  color: ${theme.colors.text.secondary};
`;

// カスタムマーカーアイコン
const createCustomIcon = (type: 'current' | 'visited' | 'fictional', isActive: boolean = false) => {
  const size = isActive ? 40 : 30;
  const color = type === 'current' ? '#f59e0b' : 
                type === 'visited' ? '#10b981' : 
                '#8b5cf6';
  
  return new DivIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: ${isActive ? 'pulse 2s infinite' : 'none'};
      ">
        <div style="
          width: ${size - 12}px;
          height: ${size - 12}px;
          background: white;
          border-radius: 50%;
          opacity: 0.8;
        "></div>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }
      </style>
    `,
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

// 地図の視点を制御するコンポーネント
const MapController: React.FC<{ 
  currentLocation: Location; 
  visitedLocations: Location[];
}> = ({ currentLocation, visitedLocations }) => {
  const map = useMap();

  useEffect(() => {
    if (visitedLocations.length <= 1) {
      // 最初の地点の場合、その地点を中心に表示
      map.setView([currentLocation.coords.lat, currentLocation.coords.lng], 6);
    } else {
      // 複数の地点を訪問している場合、すべての地点が見えるように調整
      const allLocations = [...visitedLocations, currentLocation];
      const bounds = new LatLngBounds(
        allLocations.map(loc => [loc.coords.lat, loc.coords.lng])
      );
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [currentLocation, visitedLocations, map]);

  return null;
};

const MapNavigation: React.FC<MapNavigationProps> = ({
  currentLocation,
  visitedLocations,
  onLocationSelect,
  showMiniMap = false,
  className
}) => {
  // const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  const formatCoordinates = (lat: number, lng: number): string => {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(4)}°${latDir} ${Math.abs(lng).toFixed(4)}°${lngDir}`;
  };

  const mapVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
    }
  };

  const infoVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
    }
  };

  return (
    <MapWrapper 
      className={className}
      showMiniMap={showMiniMap}
      variants={mapVariants}
      initial="hidden"
      animate="visible"
    >
      <StyledMapContainer
        center={[currentLocation.coords.lat, currentLocation.coords.lng]}
        zoom={6}
        scrollWheelZoom={!showMiniMap}
        zoomControl={!showMiniMap}
        dragging={!showMiniMap}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        />
        
        {/* 地図コントローラー */}
        <MapController 
          currentLocation={currentLocation}
          visitedLocations={visitedLocations}
        />

        {/* 訪問済み地点のマーカー */}
        {visitedLocations.map((location) => (
          <Marker
            key={`visited-${location.id}`}
            position={[location.coords.lat, location.coords.lng]}
            icon={createCustomIcon('visited')}
            eventHandlers={{
              click: () => onLocationSelect?.(location)
            }}
          >
            <Popup>
              <div style={{ textAlign: 'center' }}>
                <strong>{location.name}</strong><br />
                <small>{location.nameEn}</small><br />
                <em>訪問済み</em>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 現在地のマーカー */}
        <Marker
          position={[currentLocation.coords.lat, currentLocation.coords.lng]}
          icon={createCustomIcon('current', true)}
          eventHandlers={{
            click: () => onLocationSelect?.(currentLocation)
          }}
        >
          <Popup>
            <div style={{ textAlign: 'center' }}>
              <strong>{currentLocation.name}</strong><br />
              <small>{currentLocation.nameEn}</small><br />
              <em>現在地</em><br />
              <small>{formatCoordinates(currentLocation.coords.lat, currentLocation.coords.lng)}</small>
            </div>
          </Popup>
        </Marker>
      </StyledMapContainer>

      {/* 地点情報オーバーレイ（フルサイズ表示時のみ） */}
      {!showMiniMap && (
        <AnimatePresence>
          <LocationInfo
            variants={infoVariants}
            initial="hidden"
            animate="visible"
          >
            <LocationName>{currentLocation.name}</LocationName>
            <LocationCoords>
              {formatCoordinates(currentLocation.coords.lat, currentLocation.coords.lng)}
            </LocationCoords>
          </LocationInfo>
        </AnimatePresence>
      )}
    </MapWrapper>
  );
};

export default MapNavigation;