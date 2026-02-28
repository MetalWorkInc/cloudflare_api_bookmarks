export abstract class PaginationDto {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;

  protected constructor(
    page: number,
    pageSize: number,
    total: number,
    totalPages: number,
    hasNext: boolean,
    hasPrev: boolean,
  ) {
    this.page = page;
    this.pageSize = pageSize;
    this.total = total;
    this.totalPages = totalPages;
    this.hasNext = hasNext;
    this.hasPrev = hasPrev;
  }
}
