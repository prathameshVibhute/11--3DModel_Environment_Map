export const environmentMaps: any[] = [
  {
    "japaneseStreet": 'public/environmentMaps/blockadesLabsSkybox/anime_art_style_japan_streets_with_cherry_blossom_.jpg'
  },
  {
    "neonCity": "public/environmentMaps/blockadesLabsSkybox/anime_art_style_japan_streets_with_cherry_blossom_.jpg"
  },
  {
    "fantasyLand": "public/environmentMaps/blockadesLabsSkybox/fantasy_lands_castles_at_night.jpg"
  },
  {
    "interiorView": "public/environmentMaps/blockadesLabsSkybox/interior_views_cozy_wood_cabin_with_cauldron_and_p.jpg"
  },
  {
    "scifiCity": "public/environmentMaps/blockadesLabsSkybox/scifi_white_sky_scrapers_in_clouds_at_day_time.jpg"
  },
  {
    "multiColor": "public/environmentMaps/multi-color.hdr"
  },
  {
    "blender2K": "public/environmentMaps/blender-2k.hdr"
  }
];

export const environmentMapKeys: any[] = environmentMaps.map((environmentMap: any) => {
  return Object.keys(environmentMap)[0];
});