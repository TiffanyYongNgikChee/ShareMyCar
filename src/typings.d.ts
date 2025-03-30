// src/typings.d.ts
declare namespace google.maps {
    class Map {
      constructor(element: HTMLElement, options?: MapOptions);
      setCenter(latLng: LatLng | LatLngLiteral): void;
    }
    class Marker {
      constructor(options?: MarkerOptions);
      setMap(map: Map | null): void;
      addListener(eventName: string, handler: Function): void;
    }
    class InfoWindow {
      constructor(options?: InfoWindowOptions);
      open(map?: Map, marker?: Marker): void;
    }
    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      fullscreenControl?: boolean;
    }
    interface MarkerOptions {
      position?: LatLng | LatLngLiteral;
      map?: Map;
      title?: string;
    }
    interface InfoWindowOptions {
      content?: string | Node;
    }
    interface LatLng {
      lat(): number;
      lng(): number;
    }
    interface LatLngLiteral {
      lat: number;
      lng: number;
    }
  }
  