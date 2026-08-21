import React from "react";
import { InteractiveMap } from "./InteractiveMap";

export function GoogleMapsPicker({
  onLocationSelect,
  initialLat = 16.5062,
  initialLng = 80.6480,
  height = "h-72",
  existingCases = [],
}) {
  return (
    <InteractiveMap
      mode="picker"
      onLocationSelect={onLocationSelect}
      initialLat={initialLat}
      initialLng={initialLng}
      initialZoom={14}
      existingCases={existingCases}
      height={height}
    />
  );
}

export default GoogleMapsPicker;
