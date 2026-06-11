import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

// Coordinates for Bashundhara Blocks (roughly centered)
const BLOCK_COORDINATES = {
  'Block A': [23.8115, 90.4248],
  'Block B': [23.8125, 90.4300],
  'Block C': [23.8160, 90.4310],
  'Block D': [23.8185, 90.4315],
  'Block E': [23.8210, 90.4310],
  'Block F': [23.8235, 90.4280],
  'Block G': [23.8205, 90.4260],
  'Block H': [23.8175, 90.4250],
  'Block I': [23.8145, 90.4240],
  'Block J': [23.8120, 90.4200],
  'Block K': [23.8250, 90.4330],
  'Block L': [23.8260, 90.4380],
  'Block M': [23.8280, 90.4360],
  'Block N': [23.8300, 90.4400]
};

export default function BashundharaMap({ selectedBlocks = [], onSelectBlock, multiSelect = false }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (mapInstanceRef.current) return; // already initialized

    // Coordinate centers Bashundhara
    const map = L.map(mapContainerRef.current).setView([23.8180, 90.4280], 14);
    mapInstanceRef.current = map;

    // Load premium free dark-mode tile layers from CartoDB
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // Create a LayerGroup for block shapes/markers
    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update block shapes/markers when selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    Object.entries(BLOCK_COORDINATES).forEach(([blockName, coords]) => {
      const isSelected = selectedBlocks.includes(blockName);

      // Define circle options
      const circleOptions = {
        color: isSelected ? '#6366f1' : '#475569',
        fillColor: isSelected ? '#6366f1' : '#334155',
        fillOpacity: isSelected ? 0.6 : 0.2,
        radius: 180, // radius in meters
        weight: isSelected ? 3 : 1.5,
        cursor: 'pointer'
      };

      // Create interactive circle for the block
      const circle = L.circle(coords, circleOptions)
        .addTo(layerGroup)
        .bindTooltip(`<b>${blockName}</b>${isSelected ? ' (Selected)' : ''}`, {
          permanent: false,
          direction: 'top'
        });

      // Handle block click event
      circle.on('click', () => {
        if (multiSelect) {
          let updated;
          if (isSelected) {
            updated = selectedBlocks.filter(b => b !== blockName);
          } else {
            updated = [...selectedBlocks, blockName];
          }
          onSelectBlock(updated);
        } else {
          onSelectBlock(isSelected ? '' : blockName);
        }
      });
    });
  }, [selectedBlocks, multiSelect, onSelectBlock]);

  return (
    <div style={{ position: 'relative' }}>
      <div 
        ref={mapContainerRef} 
        className="map-container"
        style={{ height: '400px', width: '100%' }}
      />
      <div 
        style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.85)',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '0.75rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          pointerEvents: 'none'
        }}
      >
        🗺️ Click on any block circle to select working area
      </div>
    </div>
  );
}
