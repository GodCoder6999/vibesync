/** Static section layout mirroring open.spotify.com home page, with
 * playlist IDs extracted from the reference HTML. Sections that
 * Spotify personalises (Made For You, Inspired by your recent
 * activity) fall back to user-driven content in the Home component. */

export type HomeSection = {
  title: string
  subtitle?: string
  href?: string
  kind: 'playlist' | 'album' | 'artist'
  ids: string[]
  circle?: boolean
}

export const HOME_SECTIONS: HomeSection[] = [
  {
    title: "It's New Music Friday!",
    kind: 'playlist',
    ids: [
      '37i9dQZF1DX4JAvHpjipBk', // New Music Friday
      '37i9dQZF1DWUW2bvSkjcJ6', // New Music Friday India
      '37i9dQZF1DX6aTaZa0K6VA', // Released This Week
      '37i9dQZF1DXcF6B6QPhFDv', // Rock This
      '37i9dQZF1DX2L0iB23Enbq', // Vibra Latina
      '37i9dQZF1DX10zKzsJ2jva', // ¡Viva Latino!
    ],
  },
  {
    title: 'Popular albums and singles',
    kind: 'album',
    ids: [
      '4Qhs9M8b7MafoxTPhfG6Hq',
      '5D3TiAKpPTQQB9f1j1DXly',
      '6cUhnbhBBTFNb6z2w7llGx',
      '0QLILSOq1IqAqx62drmv4E',
      '7cP06bf7dmkZN52CEaoz4a',
      '3BGU0BqGwBkYDHpfCWFm7I',
    ],
  },
  {
    title: 'Your top mixes',
    kind: 'playlist',
    ids: [
      '37i9dQZF1DWWkrGNlIHxPl', // 2010s Mix
      '37i9dQZF1DX11otjJ7crqp', // Pop Mix
      '37i9dQZF1DX2M1RktxUUHG', // Chill Mix
      '37i9dQZF1DX4OzrY981I1W', // Art Pop Mix
      '37i9dQZF1DX5Ejj0EkURtP', // Indie Mix
      '37i9dQZF1DX6Pu7l5vEGMM', // Rock Mix
    ],
  },
  {
    title: "What's New",
    kind: 'playlist',
    ids: [
      '37i9dQZF1DXcBWIGoYBM5M', // Today's Top Hits
      '37i9dQZF1DX0XUsuxWHRQd', // RapCaviar
      '37i9dQZF1DX4WYpdgoIcn6', // Chill Hits
      '37i9dQZF1DX3rxVfibe1L0', // Mood Booster
      '37i9dQZEVXbMDoHDwVN2tF', // Top 50 - Global
      '37i9dQZEVXbLRQDuF5jeBp', // Top 50 - USA
    ],
  },
  {
    title: 'Recommended Stations',
    subtitle: 'Non-stop music based on your favorite songs and artists.',
    kind: 'playlist',
    ids: [
      '37i9dQZF1DXc3KPAjGyPdm',
      '37i9dQZF1DX7J2y2eWxEnR',
      '37i9dQZF1DX8j8N3CkBtqv',
      '37i9dQZF1DWWbVYL1LBbVy',
      '37i9dQZF1DWUxHPh2rEiHr',
      '37i9dQZF1DWVgsJtp58d1t',
    ],
  },
]

export const POPULAR_ARTIST_IDS = [
  '06HL4z0CvFAxyc27GXpf02', // Taylor Swift
  '3TVXtAsR1Inumwj472S9r4', // Drake
  '1Xyo4u8uXC1ZmMpatF05PJ', // The Weeknd
  '4q3ewBCX7sLwd24euuV69X', // Bad Bunny
  '6eUKZXaKkcviH0Ku9w2n3V', // Ed Sheeran
  '4YRxDV8wJFPHPTeXepOstw', // Arijit Singh
  '66CXWjxzNUsdJxJ2JdwvnR', // Ariana Grande
  '1uNFoZAHBGtllmzznpCI3s', // Justin Bieber
]
