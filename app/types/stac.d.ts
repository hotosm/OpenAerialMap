import { FeatureCollection } from 'geojson';
import { StacItem, StacLink } from 'stac-ts';

export interface StacFeatureCollection
  extends Omit<FeatureCollection, 'features'> {
  type: 'FeatureCollection';
  features: StacItem[];
  links: StacLink[];
  numberMatched?: number;
  numberReturned?: number;
}

export interface StacFeature extends Feature {
  properties: StacItem;
}
