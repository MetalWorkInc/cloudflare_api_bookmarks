import { PaginationDto } from '../types/PaginationDto';

export interface GoogleAuthLog {
	id: string;
	iss?: string;
	azp?: string;
	aud?: string;
	sub?: string;
	email?: string;
	email_verified?: number;
	nbf?: number;
	name?: string;
	picture?: string;
	given_name?: string;
	family_name?: string;
	iat?: number;
	exp?: number;
	jti?: string;
	created_at: string;
}

export interface GoogleAuthLogInput {
	iss?: string;
	azp?: string;
	aud?: string;
	sub?: string;
	email?: string;
	email_verified?: number;
	nbf?: number;
	name?: string;
	picture?: string;
	given_name?: string;
	family_name?: string;
	iat?: number;
	exp?: number;
	jti?: string;
}

export class GoogleAuthLogPaginatedResult extends PaginationDto {
	data: GoogleAuthLogInput[];

	constructor(
		data: GoogleAuthLogInput[],
		page: number,
		pageSize: number,
		total: number,
		totalPages: number,
		hasNext: boolean,
		hasPrev: boolean,
	) {
		super(page, pageSize, total, totalPages, hasNext, hasPrev);
		this.data = data;
	}
}
