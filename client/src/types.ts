export type Track = {
  id: string
  title: string
  artist: string
  album?: string
  img: string
  duration: number
  url?: string
  query?: string
  source?: string
}

export type Tile = {
  id: string
  title: string
  subtitle: string
  img: string
  type: 'sx-playlist' | 'sx-album' | 'sx-artist' | 'sx-podcast' | 'sx-episode' | 'genre'
  query?: string
}

export type PlaylistDetail = {
  id: string
  title: string
  subtitle?: string
  img: string
  owner?: string
  tracks: Track[]
}

export type AlbumDetail = {
  id: string
  title: string
  subtitle?: string
  img: string
  year?: string
  tracks: Track[]
}

export type ArtistDetail = {
  id: string
  name: string
  img: string
  bio?: string
  follower_count?: number
  genres?: string[]
  top_songs: Track[]
  albums: Tile[]
}

export type PodcastDetail = {
  id: string
  title: string
  subtitle?: string
  description?: string
  img: string
  episodes: Track[]
}

export type SearchResults = {
  tracks: Track[]
  albums: Tile[]
  artists: Tile[]
  playlists: Tile[]
  podcasts: Tile[]
  episodes: Tile[]
  top_result?: Track | Tile
}
