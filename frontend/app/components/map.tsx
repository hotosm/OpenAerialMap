import React, { useEffect, useRef } from 'react';
import maplibregl, { LngLatBoundsLike, RasterTileSource } from 'maplibre-gl';
import { RASTER_API_PATH, useStacItems } from '$hooks/useStacCatalog';
import { Feature, FeatureCollection, Geometry } from 'geojson';
import { StacItem } from 'stac-ts';
import { StacFeatureCollection } from '../types/stac';
import { useStac } from '../context/StacContext';

interface MapComponentProps {
  centerCoordinates?: [number, number];
  containerId?: string;
  features?: Feature[];
  zoom?: number;
  onSelect?: (itemId: string) => void;
}

export default function MapComponent({
  centerCoordinates = [0, 0],
  containerId = 'map',
  features,
  zoom = 1,
  onSelect
}: MapComponentProps) {
  const { selectedItems, selectedCollection, filters } = useStac();
  const map = useRef<maplibregl.Map | null>(null);
  const { data: stacItems, isLoading } = useStacItems(
    selectedCollection,
    filters
  );

  useEffect(() => {
    if (!map.current) {
      map.current = new maplibregl.Map({
        container: containerId,
        style: {
          version: 8,
          sources: {
            'osm-tiles': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors'
            }
          },
          layers: [
            {
              id: 'osm-tiles',
              type: 'raster',
              source: 'osm-tiles',
              minzoom: 0,
              maxzoom: 19
            }
          ]
        },
        center: centerCoordinates,
        zoom: zoom
      });

      map.current.on('load', () => {
        // Add collection mosaic source and layer
        if (!map.current?.getSource('stac-collection-data')) {
          // Add the raster source first
          map.current?.addSource('stac-collection-data', {
            type: 'raster',
            tiles: [],
            tileSize: 256,
            minzoom: 10,
            maxzoom: 22
          });

          map.current?.addLayer({
            id: 'stac-collection-layer',
            type: 'raster',
            source: 'stac-collection-data',
            paint: {
              'raster-opacity': 0.9
            }
          });

          // Then add STAC items source and layers
          map.current?.addSource('stac-items-data', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: []
            }
          });

          // Add all items layer (base layer)
          map.current?.addLayer({
            id: 'stac-items-layer',
            type: 'fill',
            source: 'stac-items-data',
            paint: {
              'fill-color': '#fff',
              'fill-opacity': 0.25,
              'fill-outline-color': '#fff',
              'fill-antialias': true
            }
          });

          // Add selected items layer (highlighted on top)
          map.current?.addLayer({
            id: 'selected-items-layer',
            type: 'fill',
            source: 'stac-items-data',
            paint: {
              'fill-color': '#b30000',
              'fill-opacity': 0.25,
              'fill-outline-color': '#b30000',
              'fill-antialias': true
            },
            filter: ['in', ['get', 'id'], ['literal', []]]
          });

          // Change cursor on hover
          map.current?.on('mouseenter', 'stac-items-layer', () => {
            if (map.current) {
              map.current.getCanvas().style.cursor = 'pointer';
            }
          });

          map.current?.on('mouseleave', 'stac-items-layer', () => {
            if (map.current) {
              map.current.getCanvas().style.cursor = '';
            }
          });
        }
      });
    }
  }, [
    features,
    centerCoordinates,
    containerId,
    zoom,
    onSelect,
    selectedCollection
  ]);

  useEffect(() => {
    if (
      map.current &&
      selectedCollection &&
      !isLoading &&
      stacItems &&
      map.current.getSource('stac-items-data')
    ) {
      function prepareStacItemsForMapLibre(
        stacItems: StacFeatureCollection
      ): FeatureCollection {
        return {
          type: 'FeatureCollection',
          features: stacItems.features
            .filter(
              (
                feature
              ): feature is StacItem & {
                geometry: NonNullable<StacItem['geometry']>;
              } => feature.geometry !== null
            )
            .map((feature) => ({
              type: 'Feature',
              geometry: feature.geometry as Geometry,
              properties: {
                ...feature.properties,
                id: feature.id
              },
              id: feature.id
            }))
        };
      }
      (
        map.current.getSource('stac-items-data') as maplibregl.GeoJSONSource
      ).setData(prepareStacItemsForMapLibre(stacItems) as FeatureCollection);
      map.current.triggerRepaint();
    }
  }, [stacItems, isLoading, selectedCollection]);

  // Update selected items filter and zoom to last selected
  useEffect(() => {
    if (map.current && map.current.getLayer('selected-items-layer')) {
      // Update the filter to show only selected items
      map.current.setFilter('selected-items-layer', [
        'in',
        ['get', 'id'],
        ['literal', selectedItems]
      ]);

      // Zoom to the last selected feature
      if (
        stacItems &&
        stacItems?.features.length > 0 &&
        selectedItems?.length > 0
      ) {
        const lastSelectedId = selectedItems[selectedItems.length - 1];
        const lastFeature = stacItems.features.find(
          (f) => f.id === lastSelectedId
        );

        if (lastFeature?.bbox) {
          map.current.fitBounds(lastFeature.bbox as LngLatBoundsLike, {
            padding: 100
          });
        }
      }
    }
  }, [selectedItems, stacItems]);

  // Update mosaic raster data when collection changes
  useEffect(() => {
    if (
      map.current &&
      selectedCollection &&
      map.current.getSource('stac-collection-data')
    ) {
      const params = new URLSearchParams();
      params.append('assets', 'visual');
      const queryParams = params.toString() ? `?${params.toString()}` : '';

      const source = map.current.getSource(
        'stac-collection-data'
      ) as RasterTileSource;
      source.setTiles([
        `${RASTER_API_PATH}/collections/${selectedCollection}/tiles/WebMercatorQuad/{z}/{x}/{y}.png${queryParams}`
      ]);
    }
  }, [selectedCollection]);

  return (
    <div
      id='map'
      style={{ position: 'fixed', top: 0, bottom: 0, right: 0, left: 480 }}
    />
  );
}
