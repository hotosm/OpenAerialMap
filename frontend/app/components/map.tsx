// import { ChakraProvider, Flex } from '@chakra-ui/react';
import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";

export default function MapComponent() {
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!map.current) {
      map.current = new maplibregl.Map({
        container: "map", // container id
        style: "https://demotiles.maplibre.org/style.json", // style URL
        center: [0, 0], // starting position [lng, lat]
        zoom: 1, // starting zoom
      });
    }
  });

  return (
    <div
      id="map"
      style={{ position: "fixed", top: 0, bottom: 0, right: 0, left: 480 }}
    />
  );
}
