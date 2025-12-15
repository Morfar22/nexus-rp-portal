import { FC } from "react";
import { TileLayer, TileLayerProps, useMap } from "react-leaflet";
import { LatLngBounds } from "leaflet";

export const TileLayerWrapper: FC<TileLayerProps> = ({
  url,
  minZoom,
  maxZoom,
  keepBuffer,
  noWrap,
  ...rest
}: TileLayerProps) => {
  const map = useMap();
  return (
    <TileLayer
      keepBuffer={keepBuffer}
      bounds={
        new LatLngBounds(
          map.unproject([0, 8192], map.getMaxZoom()),
          map.unproject([8192, 0], map.getMaxZoom())
        )
      }
      noWrap={noWrap}
      url={url}
      minZoom={minZoom}
      maxZoom={maxZoom}
      {...rest}
    />
  );
};
