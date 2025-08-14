/**
 * CurioCity 雑学データの型定義
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface TriviaItem {
  id: number;
  title: string;
  short: string;
  detail: string;
  tags: {
    emotion: string[];
    setting: string[];
    palette: string[];
  };
  coords?: Coordinates;
  images: string[];
}

export interface Location {
  id: string;
  name: string;
  nameEn: string;
  coords: Coordinates;
  type: 'real' | 'fictional';
  weight: number;
  atmosphere: string[];
  description: string;
  country: string;
  region: string;
  timeZone: string;
  bestVisitTime?: string[];
  culturalSignificance?: string;
}

export interface TagDefinition {
  emotion: string[];
  setting: string[];
  palette: string[];
}


export interface ShareContent {
  text: string;
  shortText: string;
  imageUrl: string;
  url: string;
  hashtags: string[];
}

// 雑学データの配列型
export type TriviaData = TriviaItem[];

// 地点データの配列型
export type LocationData = Location[];