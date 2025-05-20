import React, { useEffect, useRef } from 'react';
import {
  Map,
  GeoJSONSource,
  LngLatBoundsLike,
  RasterTileSource,
  Marker,
  LngLatBounds
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
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
  const { selectedItems, selectedCollection, filters, setSelectedItems } =
    useStac();
  const map = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const { data: stacItems, isLoading } = useStacItems(
    selectedCollection,
    filters
  );

  useEffect(() => {
    if (!map.current) {
      map.current = new Map({
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
              'raster-opacity': 1
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
              'fill-color': '#000',
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
              'fill-opacity': 0.4,
              'fill-outline-color': '#b30000',
              'fill-antialias': true
            },
            filter: ['in', ['get', 'id'], ['literal', []]]
          });

          // We'll use Marker objects instead of a circle layer

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

  // Clean up markers when component unmounts
  useEffect(() => {
    return () => {
      // Remove all markers from the map
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    };
  }, []);

  // Update the stac items data and add markers
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

      // Update the GeoJSON source for the fill layers
      const preparedData = prepareStacItemsForMapLibre(
        stacItems
      ) as FeatureCollection;
      (map.current.getSource('stac-items-data') as GeoJSONSource).setData(
        preparedData
      );
      map.current.triggerRepaint();

      // First, clear any existing markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      // Add new markers for each feature
      preparedData.features.forEach((feature) => {
        if (feature.geometry.type === 'Point') {
          // For Point geometries, use the coordinates directly
          const [lng, lat] = feature.geometry.coordinates;
          const marker = new Marker({ color: '#3388ff' })
            .setLngLat([lng, lat])
            .addTo(map.current!);

          // Add click handler to zoom to this point
          const markerElement = marker.getElement();
          markerElement.style.cursor = 'pointer';

          markerElement.addEventListener('click', () => {
            // For point geometries, fly to the point location with zoom
            map.current?.flyTo({
              center: [lng, lat],
              zoom: 14,
              speed: 0.8,
              essential: true
            });

            // Select this item in the context
            if (feature.id) {
              setSelectedItems([feature.id.toString()]);

              // Also call the onSelect prop if provided
              if (onSelect) {
                onSelect(feature.id.toString());
              }
            }
          });

          markersRef.current.push(marker);
        } else if (
          feature.geometry.type === 'Polygon' ||
          feature.geometry.type === 'MultiPolygon'
        ) {
          // For polygons, calculate the centroid
          const bounds = new LngLatBounds();

          if (feature.geometry.type === 'Polygon') {
            feature.geometry.coordinates[0].forEach((coord) => {
              bounds.extend([coord[0], coord[1]]);
            });
          } else {
            // Handle MultiPolygon
            feature.geometry.coordinates.forEach((polygon) => {
              polygon[0].forEach((coord) => {
                bounds.extend([coord[0], coord[1]]);
              });
            });
          }

          const center = bounds.getCenter();
          const marker = new Marker({ color: '#3388ff' })
            .setLngLat(center)
            .addTo(map.current!);

          // Add click handler to zoom to this polygon's bounds
          const markerElement = marker.getElement();
          markerElement.style.cursor = 'pointer';

          markerElement.addEventListener('click', () => {
            // For polygon geometries, fit to the bounds
            map.current?.fitBounds(bounds, {
              padding: 100,
              maxZoom: 16
            });

            // Select this item in the context
            if (feature.id) {
              setSelectedItems([feature.id.toString()]);
            }
          });

          markersRef.current.push(marker);
        }
      });
    }
  }, [stacItems, isLoading, selectedCollection, setSelectedItems, onSelect]);

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
      // Clear any existing markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      const params = new URLSearchParams();
      params.append('assets', 'visual');
      const queryParams = params.toString() ? `?${params.toString()}` : '';
      const itemsSource = map.current.getSource(
        'stac-items-data'
      ) as GeoJSONSource;
      itemsSource.setData({
        type: 'FeatureCollection',
        features: []
      } as FeatureCollection);

      const collectionSource = map.current.getSource(
        'stac-collection-data'
      ) as RasterTileSource;

      collectionSource.setTiles([
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
