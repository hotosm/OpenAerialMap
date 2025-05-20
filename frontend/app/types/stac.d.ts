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

export interface StacQueryable {
  title: string;
  $ref: string;
  description: string;
}

export interface StacQueryables {
  $id: string;
  $schema: string;
  additionalProperties: boolean;
  properties: Record<string, StacQueryable>;
  title: string;
  type: string;
}
