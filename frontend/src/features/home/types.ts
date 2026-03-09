export interface GearFeedItem {
  id: string;
  store_id: string;
  name: string;
  description: string;
  daily_price: number;
  image_url: string;
  category: string;
  brand?: string;
  stock?: number;
  store: {
    id: string;
    name: string;
    logo_url: string;
    rating: number;
    location_lat?: number | null;
    location_lng?: number | null;
    branches?: Array<{
      name?: string;
      address?: string;
      location_lat?: number | null;
      location_lng?: number | null;
    }>;
  };
}

export type SortMode = 'default' | 'store_az' | 'store_za';
export type ViewMode = 'gears' | 'stores';
