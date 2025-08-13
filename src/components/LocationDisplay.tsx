import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { theme } from '../styles/theme';
import type { Location } from '../../types/trivia';

interface LocationDisplayProps {
  location: Location;
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

const LocationContainer = styled(motion.div)<{ compact: boolean }>`
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: ${theme.borderRadius.xl};
  padding: ${({ compact }) => compact ? theme.spacing[4] : theme.spacing[6]};
  box-shadow: ${theme.shadows.lg};
  border: 1px solid rgba(255, 255, 255, 0.3);
  max-width: ${({ compact }) => compact ? '300px' : '400px'};
  
  @media (max-width: ${theme.breakpoints.md}) {
    max-width: 90%;
    padding: ${theme.spacing[4]};
  }
`;

const LocationHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing[3]};
`;

const LocationName = styled.h3<{ compact: boolean }>`
  font-family: ${theme.typography.fonts.secondary};
  font-size: ${({ compact }) => compact ? theme.typography.sizes.lg : theme.typography.sizes.xl};
  font-weight: ${theme.typography.weights.bold};
  color: ${theme.colors.text.primary};
  margin: 0;
  flex: 1;
`;

const LocationNameEn = styled.div<{ compact: boolean }>`
  font-family: ${theme.typography.fonts.primary};
  font-size: ${({ compact }) => compact ? theme.typography.sizes.xs : theme.typography.sizes.sm};
  color: ${theme.colors.text.secondary};
  font-style: italic;
  margin-top: ${theme.spacing[1]};
`;

const TypeBadge = styled.span<{ type: 'real' | 'fictional' }>`
  padding: ${theme.spacing[1]} ${theme.spacing[2]};
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.typography.sizes.xs};
  font-weight: ${theme.typography.weights.semibold};
  text-transform: uppercase;
  
  background: ${({ type }) => 
    type === 'real' 
      ? theme.colors.mystical.teal 
      : theme.colors.mystical.purple
  };
  color: white;
`;

const LocationDescription = styled.p<{ compact: boolean }>`
  font-family: ${theme.typography.fonts.primary};
  font-size: ${({ compact }) => compact ? theme.typography.sizes.sm : theme.typography.sizes.base};
  color: ${theme.colors.text.primary};
  line-height: 1.6;
  margin: ${theme.spacing[3]} 0;
`;

const LocationDetails = styled.div`
  margin-top: ${theme.spacing[4]};
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing[2]};
  font-size: ${theme.typography.sizes.sm};
`;

const DetailLabel = styled.span`
  color: ${theme.colors.text.secondary};
  font-weight: ${theme.typography.weights.medium};
`;

const DetailValue = styled.span`
  color: ${theme.colors.text.primary};
  font-weight: ${theme.typography.weights.semibold};
`;

const AtmosphereContainer = styled.div`
  margin-top: ${theme.spacing[3]};
`;

const AtmosphereLabel = styled.div`
  font-size: ${theme.typography.sizes.sm};
  color: ${theme.colors.text.secondary};
  font-weight: ${theme.typography.weights.medium};
  margin-bottom: ${theme.spacing[2]};
`;

const AtmosphereTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing[1]};
`;

const AtmosphereTag = styled.span`
  padding: ${theme.spacing[1]} ${theme.spacing[2]};
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.typography.sizes.xs};
  font-weight: ${theme.typography.weights.medium};
  background: ${theme.colors.gradients.mystical};
  color: white;
  opacity: 0.9;
`;

const CoordinatesDisplay = styled.div`
  font-family: ${theme.typography.fonts.mono};
  font-size: ${theme.typography.sizes.xs};
  color: ${theme.colors.text.secondary};
  margin-top: ${theme.spacing[2]};
  padding: ${theme.spacing[2]};
  background: rgba(0, 0, 0, 0.05);
  border-radius: ${theme.borderRadius.md};
`;

const WeightIndicator = styled.div<{ weight: number }>`
  width: 20px;
  height: 20px;
  border-radius: ${theme.borderRadius.full};
  background: ${({ weight }) => {
    if (weight >= 8) return theme.colors.mystical.amber;
    if (weight >= 6) return theme.colors.mystical.teal;
    if (weight >= 4) return theme.colors.primary[500];
    return theme.colors.text.secondary;
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${theme.typography.sizes.xs};
  font-weight: ${theme.typography.weights.bold};
  color: white;
  margin-left: ${theme.spacing[2]};
`;

const LocationDisplay: React.FC<LocationDisplayProps> = ({
  location,
  showDetails = false,
  compact = false,
  className
}) => {
  const containerVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
    }
  };

  const formatCoordinates = (lat: number, lng: number): string => {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(4)}°${latDir} ${Math.abs(lng).toFixed(4)}°${lngDir}`;
  };

  return (
    <LocationContainer
      className={className}
      compact={compact}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.5 }}
    >
      <LocationHeader>
        <div style={{ flex: 1 }}>
          <LocationName compact={compact}>{location.name}</LocationName>
          <LocationNameEn compact={compact}>{location.nameEn}</LocationNameEn>
        </div>
        <TypeBadge type={location.type}>
          {location.type === 'real' ? 'REAL' : 'FANTASY'}
        </TypeBadge>
        <WeightIndicator weight={location.weight}>
          {location.weight}
        </WeightIndicator>
      </LocationHeader>

      <LocationDescription compact={compact}>
        {location.description}
      </LocationDescription>

      {showDetails && (
        <LocationDetails>
          <DetailRow>
            <DetailLabel>国・地域:</DetailLabel>
            <DetailValue>{location.country}</DetailValue>
          </DetailRow>
          
          <DetailRow>
            <DetailLabel>エリア:</DetailLabel>
            <DetailValue>{location.region}</DetailValue>
          </DetailRow>

          {location.type === 'real' && location.bestVisitTime && (
            <DetailRow>
              <DetailLabel>最適訪問時期:</DetailLabel>
              <DetailValue>{location.bestVisitTime.join(', ')}</DetailValue>
            </DetailRow>
          )}

          {location.culturalSignificance && (
            <DetailRow>
              <DetailLabel>文化的意義:</DetailLabel>
              <DetailValue>{location.culturalSignificance}</DetailValue>
            </DetailRow>
          )}
        </LocationDetails>
      )}

      <AtmosphereContainer>
        <AtmosphereLabel>雰囲気タグ:</AtmosphereLabel>
        <AtmosphereTags>
          {location.atmosphere.map((tag, index) => (
            <AtmosphereTag key={index}>{tag}</AtmosphereTag>
          ))}
        </AtmosphereTags>
      </AtmosphereContainer>

      {showDetails && (location.coords.lat !== 0 || location.coords.lng !== 0) && (
        <CoordinatesDisplay>
          座標: {formatCoordinates(location.coords.lat, location.coords.lng)}
        </CoordinatesDisplay>
      )}
    </LocationContainer>
  );
};

export default LocationDisplay;