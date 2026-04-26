export interface Film {
	slug: string;
	title: string;
	year: string | null;
	genres: string[];
	directors: string[];
	actors: string[];
	countries: string[];
	rating: number | null;
	rating_count: number | null;
	poster: string | null;
	url: string;
	appears_in_n_lists: number;
}

export interface SourceList {
	href: string;
	user: string;
	slug: string;
	title: string | null;
	desc?: string | null;
	owner?: string | null;
	tags?: string[] | null;
}

export interface Aggregates {
	genres: Record<string, number>;
	directors: Record<string, number>;
	years: Record<string, number>;
}

export interface Nanogenre {
	query: string;
	slug: string;
	min_list_appearances_used: number;
	source_lists: SourceList[];
	source_list_count: number;
	films_considered: number;
	canonical_count: number;
	films: Film[];
	aggregates: Aggregates;
}

export interface NanogenreSummary {
	slug: string;
	query: string;
	source_list_count: number;
	canonical_count: number;
	top_films: { title: string; year: string | null }[];
}
