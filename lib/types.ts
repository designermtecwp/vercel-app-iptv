export interface Channel {
  id: number;
  name: string;
  category: string;
  color: string;
  progress?: number;
  program?: string;
  epg?: string;
}

export interface Movie {
  id: number;
  title: string;
  genre: string;
  year: number;
  color: string;
  accent: string;
}
