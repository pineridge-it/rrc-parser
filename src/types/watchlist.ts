import { UUID } from './common';

export interface WatchlistItem {
  id: UUID;
  userId: UUID;
  workspaceId: UUID;
  itemType: 'permit' | 'operator';
  permitId?: UUID;
  operatorId?: UUID;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WatchlistItemCreateRequest {
  itemType: 'permit' | 'operator';
  permitId?: UUID;
  operatorId?: UUID;
  notes?: string;
}

export interface WatchlistItemUpdateRequest {
  notes: string;
}

export interface WatchlistResponse {
  items: WatchlistItem[];
  total: number;
}

export interface WatchlistCheckResponse {
  watched: boolean;
}