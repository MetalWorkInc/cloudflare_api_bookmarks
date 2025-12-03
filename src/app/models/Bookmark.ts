
export interface Bookmark {
  id: string;
  title: string;
  url: string;
  icon?: string;
  description?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BookmarkInput {
  title: string;
  url: string;
  icon?: string;
  description?: string;
  tags?: string[];
}
