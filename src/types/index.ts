export interface Bar {
  id: number;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  state: string;
  website: string;
  description: string;
  whiskyList?: string;
}

export interface Cocktail {
  id: string;
  name: string;
  image: string;
  ogRecipe: string;
  freshTake: string;
  shopUrl: string;
}

export type ViewMode = 'map' | 'list';
