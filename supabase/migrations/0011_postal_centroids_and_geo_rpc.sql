-- ============================================================================
-- Migration 0011: Canadian Postal FSA Centroids, Location Backfill & PostGIS RPCs
-- Implements FR-X-03, FR-X-05, FR-DL-06, H6 (ST_DWithin & ST_Distance)
-- ============================================================================

-- 1. Seed ~115 Canadian FSA Centroids Across All 10 Provinces & 3 Territories
INSERT INTO public.postal_centroids (postal_prefix, city, province, latitude, longitude, location)
VALUES
  -- Ontario — Greater Toronto Area
  ('M5V', 'Toronto', 'ON', 43.6426, -79.3871, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.3871, 43.6426), 4326)::extensions.geography),
  ('M5J', 'Toronto', 'ON', 43.6414, -79.3807, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.3807, 43.6414), 4326)::extensions.geography),
  ('M5H', 'Toronto', 'ON', 43.6505, -79.3845, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.3845, 43.6505), 4326)::extensions.geography),
  ('M5G', 'Toronto', 'ON', 43.6562, -79.3853, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.3853, 43.6562), 4326)::extensions.geography),
  ('M5S', 'Toronto', 'ON', 43.6629, -79.3997, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.3997, 43.6629), 4326)::extensions.geography),
  ('M5R', 'Toronto', 'ON', 43.6728, -79.4034, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.4034, 43.6728), 4326)::extensions.geography),
  ('M4W', 'Toronto', 'ON', 43.6780, -79.3820, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.3820, 43.6780), 4326)::extensions.geography),
  ('M4Y', 'Toronto', 'ON', 43.6666, -79.3845, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.3845, 43.6666), 4326)::extensions.geography),
  ('M4B', 'Toronto', 'ON', 43.7063, -79.3094, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.3094, 43.7063), 4326)::extensions.geography),
  ('M4C', 'Toronto', 'ON', 43.6953, -79.3184, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.3184, 43.6953), 4326)::extensions.geography),
  ('M4E', 'Toronto', 'ON', 43.6763, -79.2930, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.2930, 43.6763), 4326)::extensions.geography),
  ('M6K', 'Toronto', 'ON', 43.6368, -79.4282, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.4282, 43.6368), 4326)::extensions.geography),
  ('M6G', 'Toronto', 'ON', 43.6695, -79.4226, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.4226, 43.6695), 4326)::extensions.geography),
  ('M6H', 'Toronto', 'ON', 43.6690, -79.4423, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.4423, 43.6690), 4326)::extensions.geography),
  ('M6P', 'Toronto', 'ON', 43.6616, -79.4648, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.4648, 43.6616), 4326)::extensions.geography),
  ('M2N', 'North York', 'ON', 43.7701, -79.4085, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.4085, 43.7701), 4326)::extensions.geography),
  ('M1B', 'Scarborough', 'ON', 43.8067, -79.1944, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.1944, 43.8067), 4326)::extensions.geography),
  ('M1P', 'Scarborough', 'ON', 43.7575, -79.2733, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.2733, 43.7575), 4326)::extensions.geography),
  ('M8V', 'Etobicoke', 'ON', 43.6056, -79.5013, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.5013, 43.6056), 4326)::extensions.geography),
  ('M9B', 'Etobicoke', 'ON', 43.6509, -79.5547, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.5547, 43.6509), 4326)::extensions.geography),
  ('M9W', 'Etobicoke', 'ON', 43.7067, -79.5941, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.5941, 43.7067), 4326)::extensions.geography),
  ('L3R', 'Markham', 'ON', 43.8461, -79.3370, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.3370, 43.8461), 4326)::extensions.geography),
  ('L3P', 'Markham', 'ON', 43.8765, -79.2633, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.2633, 43.8765), 4326)::extensions.geography),
  ('L6C', 'Markham', 'ON', 43.8965, -79.3270, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.3270, 43.8965), 4326)::extensions.geography),
  ('L4B', 'Richmond Hill', 'ON', 43.8460, -79.3920, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.3920, 43.8460), 4326)::extensions.geography),
  ('L4C', 'Richmond Hill', 'ON', 43.8720, -79.4390, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.4390, 43.8720), 4326)::extensions.geography),
  ('L4K', 'Vaughan', 'ON', 43.7975, -79.5280, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.5280, 43.7975), 4326)::extensions.geography),
  ('L4L', 'Vaughan', 'ON', 43.7860, -79.5930, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.5930, 43.7860), 4326)::extensions.geography),
  ('L4J', 'Thornhill', 'ON', 43.8160, -79.4420, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.4420, 43.8160), 4326)::extensions.geography),
  ('L5B', 'Mississauga', 'ON', 43.5890, -79.6441, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.6441, 43.5890), 4326)::extensions.geography),
  ('L5A', 'Mississauga', 'ON', 43.5820, -79.6130, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.6130, 43.5820), 4326)::extensions.geography),
  ('L5M', 'Mississauga', 'ON', 43.5620, -79.7130, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.7130, 43.5620), 4326)::extensions.geography),
  ('L5N', 'Mississauga', 'ON', 43.5895, -79.7570, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.7570, 43.5895), 4326)::extensions.geography),
  ('L4W', 'Mississauga', 'ON', 43.6350, -79.6190, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.6190, 43.6350), 4326)::extensions.geography),
  ('L6H', 'Oakville', 'ON', 43.4675, -79.6877, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.6877, 43.4675), 4326)::extensions.geography),
  ('L6L', 'Oakville', 'ON', 43.4285, -79.7265, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.7265, 43.4285), 4326)::extensions.geography),
  ('L6M', 'Oakville', 'ON', 43.4375, -79.7400, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.7400, 43.4375), 4326)::extensions.geography),
  ('L6J', 'Oakville', 'ON', 43.4495, -79.6650, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.6650, 43.4495), 4326)::extensions.geography),
  ('L7L', 'Burlington', 'ON', 43.3770, -79.7710, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.7710, 43.3770), 4326)::extensions.geography),
  ('L7M', 'Burlington', 'ON', 43.3830, -79.8240, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.8240, 43.3830), 4326)::extensions.geography),
  ('L7R', 'Burlington', 'ON', 43.3255, -79.7990, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.7990, 43.3255), 4326)::extensions.geography),
  ('L6P', 'Brampton', 'ON', 43.7650, -79.6850, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.6850, 43.7650), 4326)::extensions.geography),
  ('L6T', 'Brampton', 'ON', 43.7130, -79.6980, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.6980, 43.7130), 4326)::extensions.geography),
  ('L6Y', 'Brampton', 'ON', 43.6580, -79.7620, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.7620, 43.6580), 4326)::extensions.geography),
  ('L1S', 'Ajax', 'ON', 43.8509, -79.0204, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.0204, 43.8509), 4326)::extensions.geography),
  ('L1T', 'Ajax', 'ON', 43.8760, -79.0410, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.0410, 43.8760), 4326)::extensions.geography),
  ('L1N', 'Whitby', 'ON', 43.8680, -78.9380, extensions.ST_SetSRID(extensions.ST_MakePoint(-78.9380, 43.8680), 4326)::extensions.geography),
  ('L1R', 'Whitby', 'ON', 43.8960, -78.9470, extensions.ST_SetSRID(extensions.ST_MakePoint(-78.9470, 43.8960), 4326)::extensions.geography),
  ('L1G', 'Oshawa', 'ON', 43.8971, -78.8658, extensions.ST_SetSRID(extensions.ST_MakePoint(-78.8658, 43.8971), 4326)::extensions.geography),
  ('L1H', 'Oshawa', 'ON', 43.8820, -78.8420, extensions.ST_SetSRID(extensions.ST_MakePoint(-78.8420, 43.8820), 4326)::extensions.geography),
  ('L4G', 'Aurora', 'ON', 44.0065, -79.4504, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.4504, 44.0065), 4326)::extensions.geography),
  ('L3X', 'Newmarket', 'ON', 44.0592, -79.4613, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.4613, 44.0592), 4326)::extensions.geography),
  ('L3Y', 'Newmarket', 'ON', 44.0510, -79.4420, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.4420, 44.0510), 4326)::extensions.geography),

  -- Ontario — Regional Cities
  ('L8P', 'Hamilton', 'ON', 43.2557, -79.8711, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.8711, 43.2557), 4326)::extensions.geography),
  ('L8L', 'Hamilton', 'ON', 43.2610, -79.8470, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.8470, 43.2610), 4326)::extensions.geography),
  ('L2R', 'St. Catharines', 'ON', 43.1594, -79.2469, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.2469, 43.1594), 4326)::extensions.geography),
  ('L2E', 'Niagara Falls', 'ON', 43.0896, -79.0849, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.0849, 43.0896), 4326)::extensions.geography),
  ('N1H', 'Guelph', 'ON', 43.5448, -80.2482, extensions.ST_SetSRID(extensions.ST_MakePoint(-80.2482, 43.5448), 4326)::extensions.geography),
  ('N2G', 'Kitchener', 'ON', 43.4516, -80.4925, extensions.ST_SetSRID(extensions.ST_MakePoint(-80.4925, 43.4516), 4326)::extensions.geography),
  ('N2L', 'Waterloo', 'ON', 43.4643, -80.5204, extensions.ST_SetSRID(extensions.ST_MakePoint(-80.5204, 43.4643), 4326)::extensions.geography),
  ('L4M', 'Barrie', 'ON', 44.3894, -79.6903, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.6903, 44.3894), 4326)::extensions.geography),
  ('L4N', 'Barrie', 'ON', 44.3540, -79.6940, extensions.ST_SetSRID(extensions.ST_MakePoint(-79.6940, 44.3540), 4326)::extensions.geography),
  ('K9H', 'Peterborough', 'ON', 44.3091, -78.3197, extensions.ST_SetSRID(extensions.ST_MakePoint(-78.3197, 44.3091), 4326)::extensions.geography),
  ('N6A', 'London', 'ON', 42.9849, -81.2453, extensions.ST_SetSRID(extensions.ST_MakePoint(-81.2453, 42.9849), 4326)::extensions.geography),
  ('N6B', 'London', 'ON', 42.9810, -81.2330, extensions.ST_SetSRID(extensions.ST_MakePoint(-81.2330, 42.9810), 4326)::extensions.geography),
  ('K7L', 'Kingston', 'ON', 44.2312, -76.4860, extensions.ST_SetSRID(extensions.ST_MakePoint(-76.4860, 44.2312), 4326)::extensions.geography),
  ('K1P', 'Ottawa', 'ON', 45.4215, -75.6972, extensions.ST_SetSRID(extensions.ST_MakePoint(-75.6972, 45.4215), 4326)::extensions.geography),
  ('K1A', 'Ottawa', 'ON', 45.4235, -75.7009, extensions.ST_SetSRID(extensions.ST_MakePoint(-75.7009, 45.4235), 4326)::extensions.geography),
  ('K2P', 'Ottawa', 'ON', 45.4150, -75.6930, extensions.ST_SetSRID(extensions.ST_MakePoint(-75.6930, 45.4150), 4326)::extensions.geography),
  ('K1S', 'Ottawa', 'ON', 45.4020, -75.6890, extensions.ST_SetSRID(extensions.ST_MakePoint(-75.6890, 45.4020), 4326)::extensions.geography),
  ('K2K', 'Kanata', 'ON', 45.3240, -75.9100, extensions.ST_SetSRID(extensions.ST_MakePoint(-75.9100, 45.3240), 4326)::extensions.geography),
  ('N9A', 'Windsor', 'ON', 42.3149, -83.0364, extensions.ST_SetSRID(extensions.ST_MakePoint(-83.0364, 42.3149), 4326)::extensions.geography),
  ('P3E', 'Sudbury', 'ON', 46.4917, -80.9930, extensions.ST_SetSRID(extensions.ST_MakePoint(-80.9930, 46.4917), 4326)::extensions.geography),
  ('P7B', 'Thunder Bay', 'ON', 48.3809, -89.2477, extensions.ST_SetSRID(extensions.ST_MakePoint(-89.2477, 48.3809), 4326)::extensions.geography),

  -- Quebec
  ('H3A', 'Montreal', 'QC', 45.5017, -73.5673, extensions.ST_SetSRID(extensions.ST_MakePoint(-73.5673, 45.5017), 4326)::extensions.geography),
  ('H2Y', 'Montreal', 'QC', 45.5028, -73.5558, extensions.ST_SetSRID(extensions.ST_MakePoint(-73.5558, 45.5028), 4326)::extensions.geography),
  ('H3B', 'Montreal', 'QC', 45.4995, -73.5698, extensions.ST_SetSRID(extensions.ST_MakePoint(-73.5698, 45.4995), 4326)::extensions.geography),
  ('H2X', 'Montreal', 'QC', 45.5125, -73.5690, extensions.ST_SetSRID(extensions.ST_MakePoint(-73.5690, 45.5125), 4326)::extensions.geography),
  ('H2T', 'Montreal', 'QC', 45.5240, -73.5990, extensions.ST_SetSRID(extensions.ST_MakePoint(-73.5990, 45.5240), 4326)::extensions.geography),
  ('H4A', 'Montreal', 'QC', 45.4730, -73.6190, extensions.ST_SetSRID(extensions.ST_MakePoint(-73.6190, 45.4730), 4326)::extensions.geography),
  ('H3Z', 'Westmount', 'QC', 45.4850, -73.5960, extensions.ST_SetSRID(extensions.ST_MakePoint(-73.5960, 45.4850), 4326)::extensions.geography),
  ('H1A', 'Montreal', 'QC', 45.6470, -73.5040, extensions.ST_SetSRID(extensions.ST_MakePoint(-73.5040, 45.6470), 4326)::extensions.geography),
  ('H7T', 'Laval', 'QC', 45.5653, -73.7495, extensions.ST_SetSRID(extensions.ST_MakePoint(-73.7495, 45.5653), 4326)::extensions.geography),
  ('H7S', 'Laval', 'QC', 45.5670, -73.7760, extensions.ST_SetSRID(extensions.ST_MakePoint(-73.7760, 45.5670), 4326)::extensions.geography),
  ('H7V', 'Laval', 'QC', 45.5450, -73.7330, extensions.ST_SetSRID(extensions.ST_MakePoint(-73.7330, 45.5450), 4326)::extensions.geography),
  ('J4K', 'Longueuil', 'QC', 45.5250, -73.5090, extensions.ST_SetSRID(extensions.ST_MakePoint(-73.5090, 45.5250), 4326)::extensions.geography),
  ('J4L', 'Longueuil', 'QC', 45.5050, -73.4790, extensions.ST_SetSRID(extensions.ST_MakePoint(-73.4790, 45.5050), 4326)::extensions.geography),
  ('J4W', 'Brossard', 'QC', 45.4650, -73.4720, extensions.ST_SetSRID(extensions.ST_MakePoint(-73.4720, 45.4650), 4326)::extensions.geography),
  ('G1R', 'Quebec City', 'QC', 46.8139, -71.2080, extensions.ST_SetSRID(extensions.ST_MakePoint(-71.2080, 46.8139), 4326)::extensions.geography),
  ('G1K', 'Quebec City', 'QC', 46.8165, -71.2240, extensions.ST_SetSRID(extensions.ST_MakePoint(-71.2240, 46.8165), 4326)::extensions.geography),
  ('G1V', 'Quebec City', 'QC', 46.7830, -71.2750, extensions.ST_SetSRID(extensions.ST_MakePoint(-71.2750, 46.7830), 4326)::extensions.geography),
  ('J8X', 'Gatineau', 'QC', 45.4290, -75.7240, extensions.ST_SetSRID(extensions.ST_MakePoint(-75.7240, 45.4290), 4326)::extensions.geography),
  ('J8Y', 'Gatineau', 'QC', 45.4480, -75.7360, extensions.ST_SetSRID(extensions.ST_MakePoint(-75.7360, 45.4480), 4326)::extensions.geography),
  ('J1H', 'Sherbrooke', 'QC', 45.4010, -71.8824, extensions.ST_SetSRID(extensions.ST_MakePoint(-71.8824, 45.4010), 4326)::extensions.geography),
  ('G9A', 'Trois-Rivieres', 'QC', 46.3430, -72.5421, extensions.ST_SetSRID(extensions.ST_MakePoint(-72.5421, 46.3430), 4326)::extensions.geography),

  -- British Columbia
  ('V6B', 'Vancouver', 'BC', 49.2827, -123.1207, extensions.ST_SetSRID(extensions.ST_MakePoint(-123.1207, 49.2827), 4326)::extensions.geography),
  ('V6E', 'Vancouver', 'BC', 49.2840, -123.1330, extensions.ST_SetSRID(extensions.ST_MakePoint(-123.1330, 49.2840), 4326)::extensions.geography),
  ('V6G', 'Vancouver', 'BC', 49.2910, -123.1400, extensions.ST_SetSRID(extensions.ST_MakePoint(-123.1400, 49.2910), 4326)::extensions.geography),
  ('V6Z', 'Vancouver', 'BC', 49.2770, -123.1280, extensions.ST_SetSRID(extensions.ST_MakePoint(-123.1280, 49.2770), 4326)::extensions.geography),
  ('V5K', 'Vancouver', 'BC', 49.2810, -123.0440, extensions.ST_SetSRID(extensions.ST_MakePoint(-123.0440, 49.2810), 4326)::extensions.geography),
  ('V5Y', 'Vancouver', 'BC', 49.2610, -123.1110, extensions.ST_SetSRID(extensions.ST_MakePoint(-123.1110, 49.2610), 4326)::extensions.geography),
  ('V6H', 'Vancouver', 'BC', 49.2620, -123.1310, extensions.ST_SetSRID(extensions.ST_MakePoint(-123.1310, 49.2620), 4326)::extensions.geography),
  ('V5H', 'Burnaby', 'BC', 49.2270, -123.0010, extensions.ST_SetSRID(extensions.ST_MakePoint(-123.0010, 49.2270), 4326)::extensions.geography),
  ('V5C', 'Burnaby', 'BC', 49.2780, -123.0070, extensions.ST_SetSRID(extensions.ST_MakePoint(-123.0070, 49.2780), 4326)::extensions.geography),
  ('V6X', 'Richmond', 'BC', 49.1810, -123.1160, extensions.ST_SetSRID(extensions.ST_MakePoint(-123.1160, 49.1810), 4326)::extensions.geography),
  ('V7C', 'Richmond', 'BC', 49.1530, -123.1620, extensions.ST_SetSRID(extensions.ST_MakePoint(-123.1620, 49.1530), 4326)::extensions.geography),
  ('V3T', 'Surrey', 'BC', 49.1913, -122.8490, extensions.ST_SetSRID(extensions.ST_MakePoint(-122.8490, 49.1913), 4326)::extensions.geography),
  ('V3R', 'Surrey', 'BC', 49.1990, -122.8150, extensions.ST_SetSRID(extensions.ST_MakePoint(-122.8150, 49.1990), 4326)::extensions.geography),
  ('V3S', 'Surrey', 'BC', 49.1390, -122.7850, extensions.ST_SetSRID(extensions.ST_MakePoint(-122.7850, 49.1390), 4326)::extensions.geography),
  ('V7M', 'North Vancouver', 'BC', 49.3200, -123.0724, extensions.ST_SetSRID(extensions.ST_MakePoint(-123.0724, 49.3200), 4326)::extensions.geography),
  ('V8W', 'Victoria', 'BC', 48.4284, -123.3656, extensions.ST_SetSRID(extensions.ST_MakePoint(-123.3656, 48.4284), 4326)::extensions.geography),
  ('V8V', 'Victoria', 'BC', 48.4160, -123.3690, extensions.ST_SetSRID(extensions.ST_MakePoint(-123.3690, 48.4160), 4326)::extensions.geography),
  ('V1Y', 'Kelowna', 'BC', 49.8880, -119.4960, extensions.ST_SetSRID(extensions.ST_MakePoint(-119.4960, 49.8880), 4326)::extensions.geography),
  ('V2C', 'Kamloops', 'BC', 50.6745, -120.3273, extensions.ST_SetSRID(extensions.ST_MakePoint(-120.3273, 50.6745), 4326)::extensions.geography),
  ('V2L', 'Prince George', 'BC', 53.9171, -122.7497, extensions.ST_SetSRID(extensions.ST_MakePoint(-122.7497, 53.9171), 4326)::extensions.geography),

  -- Alberta
  ('T2P', 'Calgary', 'AB', 51.0447, -114.0719, extensions.ST_SetSRID(extensions.ST_MakePoint(-114.0719, 51.0447), 4326)::extensions.geography),
  ('T2R', 'Calgary', 'AB', 51.0405, -114.0750, extensions.ST_SetSRID(extensions.ST_MakePoint(-114.0750, 51.0405), 4326)::extensions.geography),
  ('T2G', 'Calgary', 'AB', 51.0410, -114.0450, extensions.ST_SetSRID(extensions.ST_MakePoint(-114.0450, 51.0410), 4326)::extensions.geography),
  ('T2N', 'Calgary', 'AB', 51.0630, -114.1130, extensions.ST_SetSRID(extensions.ST_MakePoint(-114.1130, 51.0630), 4326)::extensions.geography),
  ('T3A', 'Calgary', 'AB', 51.1190, -114.1550, extensions.ST_SetSRID(extensions.ST_MakePoint(-114.1550, 51.1190), 4326)::extensions.geography),
  ('T2E', 'Calgary', 'AB', 51.0840, -114.0440, extensions.ST_SetSRID(extensions.ST_MakePoint(-114.0440, 51.0840), 4326)::extensions.geography),
  ('T2J', 'Calgary', 'AB', 50.9530, -114.0450, extensions.ST_SetSRID(extensions.ST_MakePoint(-114.0450, 50.9530), 4326)::extensions.geography),
  ('T5J', 'Edmonton', 'AB', 53.5461, -113.4938, extensions.ST_SetSRID(extensions.ST_MakePoint(-113.4938, 53.5461), 4326)::extensions.geography),
  ('T5K', 'Edmonton', 'AB', 53.5410, -113.5110, extensions.ST_SetSRID(extensions.ST_MakePoint(-113.5110, 53.5410), 4326)::extensions.geography),
  ('T6E', 'Edmonton', 'AB', 53.5090, -113.4890, extensions.ST_SetSRID(extensions.ST_MakePoint(-113.4890, 53.5090), 4326)::extensions.geography),
  ('T6G', 'Edmonton', 'AB', 53.5230, -113.5260, extensions.ST_SetSRID(extensions.ST_MakePoint(-113.5260, 53.5230), 4326)::extensions.geography),
  ('T5T', 'Edmonton', 'AB', 53.5190, -113.6350, extensions.ST_SetSRID(extensions.ST_MakePoint(-113.6350, 53.5190), 4326)::extensions.geography),
  ('T4N', 'Red Deer', 'AB', 52.2681, -113.8112, extensions.ST_SetSRID(extensions.ST_MakePoint(-113.8112, 52.2681), 4326)::extensions.geography),
  ('T1J', 'Lethbridge', 'AB', 49.6956, -112.8451, extensions.ST_SetSRID(extensions.ST_MakePoint(-112.8451, 49.6956), 4326)::extensions.geography),
  ('T9H', 'Fort McMurray', 'AB', 56.7267, -111.3790, extensions.ST_SetSRID(extensions.ST_MakePoint(-111.3790, 56.7267), 4326)::extensions.geography),

  -- Manitoba
  ('R3C', 'Winnipeg', 'MB', 49.8951, -97.1384, extensions.ST_SetSRID(extensions.ST_MakePoint(-97.1384, 49.8951), 4326)::extensions.geography),
  ('R3B', 'Winnipeg', 'MB', 49.8995, -97.1470, extensions.ST_SetSRID(extensions.ST_MakePoint(-97.1470, 49.8995), 4326)::extensions.geography),
  ('R3T', 'Winnipeg', 'MB', 49.8110, -97.1490, extensions.ST_SetSRID(extensions.ST_MakePoint(-97.1490, 49.8110), 4326)::extensions.geography),
  ('R2M', 'Winnipeg', 'MB', 49.8390, -97.1050, extensions.ST_SetSRID(extensions.ST_MakePoint(-97.1050, 49.8390), 4326)::extensions.geography),
  ('R2C', 'Winnipeg', 'MB', 49.8950, -97.0030, extensions.ST_SetSRID(extensions.ST_MakePoint(-97.0030, 49.8950), 4326)::extensions.geography),
  ('R7A', 'Brandon', 'MB', 49.8485, -99.9501, extensions.ST_SetSRID(extensions.ST_MakePoint(-99.9501, 49.8485), 4326)::extensions.geography),

  -- Saskatchewan
  ('S4P', 'Regina', 'SK', 50.4452, -104.6189, extensions.ST_SetSRID(extensions.ST_MakePoint(-104.6189, 50.4452), 4326)::extensions.geography),
  ('S4S', 'Regina', 'SK', 50.4150, -104.6110, extensions.ST_SetSRID(extensions.ST_MakePoint(-104.6110, 50.4150), 4326)::extensions.geography),
  ('S4R', 'Regina', 'SK', 50.4780, -104.6360, extensions.ST_SetSRID(extensions.ST_MakePoint(-104.6360, 50.4780), 4326)::extensions.geography),
  ('S7K', 'Saskatoon', 'SK', 52.1332, -106.6700, extensions.ST_SetSRID(extensions.ST_MakePoint(-106.6700, 52.1332), 4326)::extensions.geography),
  ('S7H', 'Saskatoon', 'SK', 52.1150, -106.6310, extensions.ST_SetSRID(extensions.ST_MakePoint(-106.6310, 52.1150), 4326)::extensions.geography),
  ('S7N', 'Saskatoon', 'SK', 52.1340, -106.6120, extensions.ST_SetSRID(extensions.ST_MakePoint(-106.6120, 52.1340), 4326)::extensions.geography),

  -- Nova Scotia
  ('B3J', 'Halifax', 'NS', 44.6488, -63.5752, extensions.ST_SetSRID(extensions.ST_MakePoint(-63.5752, 44.6488), 4326)::extensions.geography),
  ('B3H', 'Halifax', 'NS', 44.6370, -63.5880, extensions.ST_SetSRID(extensions.ST_MakePoint(-63.5880, 44.6370), 4326)::extensions.geography),
  ('B3K', 'Halifax', 'NS', 44.6590, -63.5970, extensions.ST_SetSRID(extensions.ST_MakePoint(-63.5970, 44.6590), 4326)::extensions.geography),
  ('B2Y', 'Dartmouth', 'NS', 44.6652, -63.5677, extensions.ST_SetSRID(extensions.ST_MakePoint(-63.5677, 44.6652), 4326)::extensions.geography),
  ('B1P', 'Sydney', 'NS', 46.1368, -60.1942, extensions.ST_SetSRID(extensions.ST_MakePoint(-60.1942, 46.1368), 4326)::extensions.geography),

  -- New Brunswick
  ('E1C', 'Moncton', 'NB', 46.0878, -64.7782, extensions.ST_SetSRID(extensions.ST_MakePoint(-64.7782, 46.0878), 4326)::extensions.geography),
  ('E2L', 'Saint John', 'NB', 45.2733, -66.0633, extensions.ST_SetSRID(extensions.ST_MakePoint(-66.0633, 45.2733), 4326)::extensions.geography),
  ('E3B', 'Fredericton', 'NB', 45.9636, -66.6431, extensions.ST_SetSRID(extensions.ST_MakePoint(-66.6431, 45.9636), 4326)::extensions.geography),

  -- Newfoundland and Labrador
  ('A1C', 'St. John''s', 'NL', 47.5615, -52.7126, extensions.ST_SetSRID(extensions.ST_MakePoint(-52.7126, 47.5615), 4326)::extensions.geography),
  ('A1B', 'St. John''s', 'NL', 47.5680, -52.7420, extensions.ST_SetSRID(extensions.ST_MakePoint(-52.7420, 47.5680), 4326)::extensions.geography),
  ('A1E', 'St. John''s', 'NL', 47.5490, -52.7480, extensions.ST_SetSRID(extensions.ST_MakePoint(-52.7480, 47.5490), 4326)::extensions.geography),
  ('A2H', 'Corner Brook', 'NL', 48.9489, -57.9522, extensions.ST_SetSRID(extensions.ST_MakePoint(-57.9522, 48.9489), 4326)::extensions.geography),

  -- Prince Edward Island
  ('C1A', 'Charlottetown', 'PE', 46.2382, -63.1311, extensions.ST_SetSRID(extensions.ST_MakePoint(-63.1311, 46.2382), 4326)::extensions.geography),
  ('C1E', 'Charlottetown', 'PE', 46.2660, -63.1380, extensions.ST_SetSRID(extensions.ST_MakePoint(-63.1380, 46.2660), 4326)::extensions.geography),

  -- Northern Territories
  ('X1A', 'Yellowknife', 'NT', 62.4540, -114.3718, extensions.ST_SetSRID(extensions.ST_MakePoint(-114.3718, 62.4540), 4326)::extensions.geography),
  ('Y1A', 'Whitehorse', 'YT', 60.7212, -135.0568, extensions.ST_SetSRID(extensions.ST_MakePoint(-135.0568, 60.7212), 4326)::extensions.geography),
  ('X0A', 'Iqaluit', 'NU', 63.7467, -68.5170, extensions.ST_SetSRID(extensions.ST_MakePoint(-68.5170, 63.7467), 4326)::extensions.geography)
ON CONFLICT (postal_prefix) DO UPDATE SET
  city = EXCLUDED.city,
  province = EXCLUDED.province,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  location = EXCLUDED.location;

-- 2. Backfill NULL PostGIS Coordinates on Existing Listings, Dealerships, and Profiles
UPDATE public.listings l
SET location = COALESCE(
  (
    SELECT pc.location
    FROM public.postal_centroids pc
    WHERE pc.postal_prefix = upper(left(replace(l.postal_code, ' ', ''), 3))
    LIMIT 1
  ),
  (
    SELECT pc.location
    FROM public.postal_centroids pc
    WHERE pc.postal_prefix = CASE upper(l.province)
      WHEN 'QC' THEN 'H3A'
      WHEN 'BC' THEN 'V6B'
      WHEN 'AB' THEN 'T2P'
      WHEN 'MB' THEN 'R3C'
      WHEN 'SK' THEN 'S4P'
      WHEN 'NS' THEN 'B3J'
      WHEN 'NB' THEN 'E1C'
      WHEN 'NL' THEN 'A1C'
      WHEN 'PE' THEN 'C1A'
      WHEN 'NT' THEN 'X1A'
      WHEN 'YT' THEN 'Y1A'
      WHEN 'NU' THEN 'X0A'
      ELSE 'M5V'
    END
    LIMIT 1
  )
)
WHERE l.location IS NULL;

UPDATE public.dealerships d
SET location = COALESCE(
  (
    SELECT pc.location
    FROM public.postal_centroids pc
    WHERE pc.postal_prefix = upper(left(replace(d.postal_code, ' ', ''), 3))
    LIMIT 1
  ),
  (
    SELECT pc.location
    FROM public.postal_centroids pc
    WHERE pc.postal_prefix = CASE upper(d.province)
      WHEN 'QC' THEN 'H3A'
      WHEN 'BC' THEN 'V6B'
      WHEN 'AB' THEN 'T2P'
      WHEN 'MB' THEN 'R3C'
      WHEN 'SK' THEN 'S4P'
      WHEN 'NS' THEN 'B3J'
      WHEN 'NB' THEN 'E1C'
      WHEN 'NL' THEN 'A1C'
      WHEN 'PE' THEN 'C1A'
      WHEN 'NT' THEN 'X1A'
      WHEN 'YT' THEN 'Y1A'
      WHEN 'NU' THEN 'X0A'
      ELSE 'M5V'
    END
    LIMIT 1
  )
)
WHERE d.location IS NULL;

UPDATE public.profiles p
SET location = (
  SELECT pc.location
  FROM public.postal_centroids pc
  WHERE pc.postal_prefix = upper(left(replace(p.postal_code, ' ', ''), 3))
  LIMIT 1
)
WHERE p.location IS NULL
  AND p.postal_code IS NOT NULL
  AND length(replace(p.postal_code, ' ', '')) >= 3;

-- 3. PostGIS Radius-Filtered Dealer Inventory RPC (SECURITY INVOKER — preserves RLS & H1)
-- Never returns `reserve_price_cents` or competitor bid amounts.
CREATE OR REPLACE FUNCTION public.get_dealer_inventory_with_distance(
  p_dealership_id uuid,
  p_max_distance_km integer DEFAULT NULL,
  p_make text DEFAULT NULL,
  p_max_mileage_km integer DEFAULT NULL,
  p_damage_grade text DEFAULT NULL,
  p_province text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_sort_by text DEFAULT 'closing_soon'
)
RETURNS TABLE (
  id uuid,
  vin text,
  year integer,
  make text,
  model text,
  vehicle_trim text,
  mileage_km integer,
  body_type text,
  transmission text,
  drivetrain text,
  exterior_color text,
  interior_color text,
  province text,
  city text,
  postal_code text,
  damage_grade text,
  damage_hotspot_count integer,
  auction_ends_at timestamptz,
  bid_count integer,
  has_reserve boolean,
  carfax_clean boolean,
  keys_count integer,
  has_lien boolean,
  distance_km integer,
  my_current_bid_cents bigint
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_dealer_location extensions.geography;
  v_search_term text;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Authentication required';
  END IF;

  IF NOT (SELECT private.is_admin())
     AND p_dealership_id IS DISTINCT FROM (SELECT private.current_dealership_id()) THEN
    RAISE EXCEPTION 'FORBIDDEN: Caller does not belong to target dealership';
  END IF;

  SELECT d.location
  INTO v_dealer_location
  FROM public.dealerships d
  WHERE d.id = p_dealership_id
  LIMIT 1;

  v_search_term := NULLIF(btrim(COALESCE(p_search, '')), '');

  RETURN QUERY
  WITH ranked AS (
    SELECT
      l.id,
      l.vin,
      l.year,
      l.make,
      l.model,
      l.trim AS vehicle_trim,
      l.mileage_km,
      l.body_type,
      l.transmission,
      l.drivetrain,
      l.exterior_color,
      l.interior_color,
      l.province,
      l.city,
      l.postal_code,
      l.damage_grade,
      l.damage_hotspot_count,
      l.auction_ends_at,
      l.bid_count,
      (l.reserve_price_cents IS NOT NULL AND l.reserve_price_cents > 0) AS has_reserve,
      l.carfax_clean,
      l.keys_count,
      l.has_lien,
      CASE
        WHEN v_dealer_location IS NOT NULL AND l.location IS NOT NULL THEN
          GREATEST(
            1,
            ROUND((extensions.ST_Distance(l.location, v_dealer_location) / 1000.0)::numeric)::integer
          )
        ELSE NULL
      END AS distance_km,
      b.amount_cents AS my_current_bid_cents
    FROM public.listings l
    LEFT JOIN public.bids b
      ON b.listing_id = l.id
     AND b.dealership_id = p_dealership_id
     AND b.status = 'ACTIVE'
    WHERE l.status = 'ACTIVE'
      AND l.auction_ends_at > now()
      AND (
        p_max_distance_km IS NULL
        OR (
          v_dealer_location IS NOT NULL
          AND l.location IS NOT NULL
          AND extensions.ST_DWithin(
            l.location,
            v_dealer_location,
            p_max_distance_km::double precision * 1000.0
          )
        )
      )
      AND (
        p_make IS NULL
        OR upper(p_make) = 'ALL'
        OR upper(l.make) = upper(p_make)
      )
      AND (
        p_max_mileage_km IS NULL
        OR l.mileage_km <= p_max_mileage_km
      )
      AND (
        p_damage_grade IS NULL
        OR upper(p_damage_grade) = 'ALL'
        OR upper(l.damage_grade) = upper(p_damage_grade)
      )
      AND (
        p_province IS NULL
        OR upper(l.province) = upper(p_province)
      )
      AND (
        v_search_term IS NULL
        OR l.make ILIKE ('%' || v_search_term || '%')
        OR l.model ILIKE ('%' || v_search_term || '%')
        OR l.trim ILIKE ('%' || v_search_term || '%')
        OR l.vin ILIKE ('%' || v_search_term || '%')
        OR l.city ILIKE ('%' || v_search_term || '%')
      )
  )
  SELECT *
  FROM ranked
  ORDER BY
    CASE WHEN p_sort_by = 'mileage_low' THEN ranked.mileage_km END ASC,
    CASE WHEN p_sort_by = 'year_new' THEN ranked.year END DESC,
    CASE WHEN p_sort_by = 'distance_near' THEN ranked.distance_km END ASC NULLS LAST,
    ranked.auction_ends_at ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_dealer_inventory_with_distance(uuid, integer, text, integer, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_dealer_inventory_with_distance(uuid, integer, text, integer, text, text, text, text) TO authenticated, service_role;

-- 4. PostGIS Distance Lookup for Specific Listings (Inspection Dossier & Active Bids)
CREATE OR REPLACE FUNCTION public.get_dealership_listing_distances(
  p_dealership_id uuid,
  p_listing_ids uuid[]
)
RETURNS TABLE (
  listing_id uuid,
  distance_km integer
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Authentication required';
  END IF;

  IF NOT (SELECT private.is_admin())
     AND p_dealership_id IS DISTINCT FROM (SELECT private.current_dealership_id()) THEN
    RAISE EXCEPTION 'FORBIDDEN: Caller does not belong to target dealership';
  END IF;

  RETURN QUERY
  SELECT
    l.id AS listing_id,
    GREATEST(
      1,
      ROUND((extensions.ST_Distance(l.location, d.location) / 1000.0)::numeric)::integer
    ) AS distance_km
  FROM public.listings l
  JOIN public.dealerships d ON d.id = p_dealership_id
  WHERE l.id = ANY(p_listing_ids)
    AND l.location IS NOT NULL
    AND d.location IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.get_dealership_listing_distances(uuid, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_dealership_listing_distances(uuid, uuid[]) TO authenticated, service_role;

-- 5. PostGIS Unsealed Offer Distances for Seller Nearest-Dealership Sorting
-- Protected by `SECURITY INVOKER` + `bids_sealed_select` RLS policy (unsealed owner / admin only).
CREATE OR REPLACE FUNCTION public.get_unsealed_bid_distances(
  p_listing_id uuid
)
RETURNS TABLE (
  dealership_id uuid,
  distance_km integer
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT DISTINCT
    d.id AS dealership_id,
    GREATEST(
      1,
      ROUND((extensions.ST_Distance(l.location, d.location) / 1000.0)::numeric)::integer
    ) AS distance_km
  FROM public.listings l
  JOIN public.bids b
    ON b.listing_id = l.id
   AND b.status <> 'VOIDED'
  JOIN public.dealerships d
    ON d.id = b.dealership_id
  WHERE l.id = p_listing_id
    AND l.location IS NOT NULL
    AND d.location IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.get_unsealed_bid_distances(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_unsealed_bid_distances(uuid) TO authenticated, service_role;
