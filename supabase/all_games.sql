-- ============================================================
-- WC 2026 – Full match schedule (all 104 games)
-- Run in Supabase SQL Editor AFTER setup.sql
-- All times UTC. Delete old test data first if needed:
-- DELETE FROM public.games;
-- ============================================================

INSERT INTO public.games (home_team, away_team, home_flag, away_flag, kickoff, group_stage, venue, status, external_id) VALUES

-- GROUP A
('Mexico','South Africa','🇲🇽','🇿🇦','2026-06-11 19:00:00+00','Group A','Estadio Azteca, Mexico City','scheduled',1001),
('South Korea','Czechia','🇰🇷','🇨🇿','2026-06-12 02:00:00+00','Group A','Estadio Akron, Guadalajara','scheduled',1002),
('South Korea','Mexico','🇰🇷','🇲🇽','2026-06-17 01:00:00+00','Group A','AT&T Stadium, Dallas','scheduled',1003),
('South Africa','Czechia','🇿🇦','🇨🇿','2026-06-17 22:00:00+00','Group A','MetLife Stadium, New York','scheduled',1004),
('Czechia','Mexico','🇨🇿','🇲🇽','2026-06-22 01:00:00+00','Group A','Estadio Azteca, Mexico City','scheduled',1005),
('South Africa','South Korea','🇿🇦','🇰🇷','2026-06-22 01:00:00+00','Group A','Levi''s Stadium, San Francisco','scheduled',1006),

-- GROUP B
('Canada','Bosnia & Herz.','🇨🇦','🇧🇦','2026-06-12 19:00:00+00','Group B','BMO Field, Toronto','scheduled',1007),
('Portugal','DR Congo','🇵🇹','🇨🇩','2026-06-13 19:00:00+00','Group B','NRG Stadium, Houston','scheduled',1008),
('Portugal','Canada','🇵🇹','🇨🇦','2026-06-18 22:00:00+00','Group B','Estadio Akron, Guadalajara','scheduled',1009),
('Bosnia & Herz.','DR Congo','🇧🇦','🇨🇩','2026-06-18 01:00:00+00','Group B','SoFi Stadium, Los Angeles','scheduled',1010),
('DR Congo','Canada','🇨🇩','🇨🇦','2026-06-23 22:00:00+00','Group B','BMO Field, Toronto','scheduled',1011),
('Bosnia & Herz.','Portugal','🇧🇦','🇵🇹','2026-06-23 22:00:00+00','Group B','Lincoln Financial Field, Philadelphia','scheduled',1012),

-- GROUP C
('Brazil','Morocco','🇧🇷','🇲🇦','2026-06-13 22:00:00+00','Group C','MetLife Stadium, New York','scheduled',1013),
('Scotland','Haiti','🏴󠁧󠁢󠁳󠁣󠁴󠁿','🇭🇹','2026-06-14 01:30:00+00','Group C','Hard Rock Stadium, Miami','scheduled',1014),
('Brazil','Scotland','🇧🇷','🏴󠁧󠁢󠁳󠁣󠁴󠁿','2026-06-19 02:00:00+00','Group C','BC Place, Vancouver','scheduled',1015),
('Haiti','Morocco','🇭🇹','🇲🇦','2026-06-18 19:00:00+00','Group C','AT&T Stadium, Dallas','scheduled',1016),
('Morocco','Scotland','🇲🇦','🏴󠁧󠁢󠁳󠁣󠁴󠁿','2026-06-24 02:00:00+00','Group C','Estadio BBVA, Monterrey','scheduled',1017),
('Haiti','Brazil','🇭🇹','🇧🇷','2026-06-24 02:00:00+00','Group C','Hard Rock Stadium, Miami','scheduled',1018),

-- GROUP D
('USA','Paraguay','🇺🇸','🇵🇾','2026-06-13 01:00:00+00','Group D','SoFi Stadium, Los Angeles','scheduled',1019),
('Türkiye','Australia','🇹🇷','🇦🇺','2026-06-14 02:00:00+00','Group D','Levi''s Stadium, San Francisco','scheduled',1020),
('USA','Australia','🇺🇸','🇦🇺','2026-06-19 23:00:00+00','Group D','Lumen Field, Seattle','scheduled',1021),
('Paraguay','Türkiye','🇵🇾','🇹🇷','2026-06-19 19:00:00+00','Group D','Arrowhead Stadium, Kansas City','scheduled',1022),
('Australia','Paraguay','🇦🇺','🇵🇾','2026-06-25 01:00:00+00','Group D','SoFi Stadium, Los Angeles','scheduled',1023),
('Türkiye','USA','🇹🇷','🇺🇸','2026-06-25 01:00:00+00','Group D','SoFi Stadium, Los Angeles','scheduled',1024),

-- GROUP E
('Spain','Egypt','🇪🇸','🇪🇬','2026-06-14 19:00:00+00','Group E','Lincoln Financial Field, Philadelphia','scheduled',1025),
('Austria','Jordan','🇦🇹','🇯🇴','2026-06-15 03:00:00+00','Group E','Levi''s Stadium, San Francisco','scheduled',1026),
('Spain','Austria','🇪🇸','🇦🇹','2026-06-20 02:00:00+00','Group E','MetLife Stadium, New York','scheduled',1027),
('Jordan','Egypt','🇯🇴','🇪🇬','2026-06-19 22:00:00+00','Group E','Gillette Stadium, Boston','scheduled',1028),
('Egypt','Austria','🇪🇬','🇦🇹','2026-06-25 22:00:00+00','Group E','Hard Rock Stadium, Miami','scheduled',1029),
('Jordan','Spain','🇯🇴','🇪🇸','2026-06-25 22:00:00+00','Group E','Lincoln Financial Field, Philadelphia','scheduled',1030),

-- GROUP F
('Colombia','Ivory Coast','🇨🇴','🇨🇮','2026-06-14 22:00:00+00','Group F','NRG Stadium, Houston','scheduled',1031),
('Japan','Tunisia','🇯🇵','🇹🇳','2026-06-15 01:00:00+00','Group F','Estadio BBVA, Monterrey','scheduled',1032),
('Japan','Colombia','🇯🇵','🇨🇴','2026-06-20 19:00:00+00','Group F','Arrowhead Stadium, Kansas City','scheduled',1033),
('Tunisia','Ivory Coast','🇹🇳','🇨🇮','2026-06-20 22:00:00+00','Group F','Estadio Azteca, Mexico City','scheduled',1034),
('Ivory Coast','Japan','🇨🇮','🇯🇵','2026-06-26 02:00:00+00','Group F','Gillette Stadium, Boston','scheduled',1035),
('Tunisia','Colombia','🇹🇳','🇨🇴','2026-06-26 02:00:00+00','Group F','NRG Stadium, Houston','scheduled',1036),

-- GROUP G
('Germany','Saudi Arabia','🇩🇪','🇸🇦','2026-06-15 19:00:00+00','Group G','MetLife Stadium, New York','scheduled',1037),
('Sweden','New Zealand','🇸🇪','🇳🇿','2026-06-16 02:00:00+00','Group G','Lumen Field, Seattle','scheduled',1038),
('Germany','Sweden','🇩🇪','🇸🇪','2026-06-21 02:00:00+00','Group G','BC Place, Vancouver','scheduled',1039),
('Saudi Arabia','New Zealand','🇸🇦','🇳🇿','2026-06-20 23:00:00+00','Group G','AT&T Stadium, Dallas','scheduled',1040),
('New Zealand','Germany','🇳🇿','🇩🇪','2026-06-26 22:00:00+00','Group G','SoFi Stadium, Los Angeles','scheduled',1041),
('Saudi Arabia','Sweden','🇸🇦','🇸🇪','2026-06-26 22:00:00+00','Group G','Estadio Akron, Guadalajara','scheduled',1042),

-- GROUP H
('Netherlands','Senegal','🇳🇱','🇸🇳','2026-06-15 22:00:00+00','Group H','NRG Stadium, Houston','scheduled',1043),
('Iran','Ecuador','🇮🇷','🇪🇨','2026-06-16 01:00:00+00','Group H','Lincoln Financial Field, Philadelphia','scheduled',1044),
('Netherlands','Iran','🇳🇱','🇮🇷','2026-06-21 19:00:00+00','Group H','Levi''s Stadium, San Francisco','scheduled',1045),
('Ecuador','Senegal','🇪🇨','🇸🇳','2026-06-21 22:00:00+00','Group H','AT&T Stadium, Dallas','scheduled',1046),
('Senegal','Iran','🇸🇳','🇮🇷','2026-06-27 02:00:00+00','Group H','Hard Rock Stadium, Miami','scheduled',1047),
('Ecuador','Netherlands','🇪🇨','🇳🇱','2026-06-27 02:00:00+00','Group H','BC Place, Vancouver','scheduled',1048),

-- GROUP I
('France','Norway','🇫🇷','🇳🇴','2026-06-16 19:00:00+00','Group I','MetLife Stadium, New York','scheduled',1049),
('Iraq','Algeria','🇮🇶','🇩🇿','2026-06-16 22:00:00+00','Group I','Gillette Stadium, Boston','scheduled',1050),
('France','Iraq','🇫🇷','🇮🇶','2026-06-22 02:00:00+00','Group I','Arrowhead Stadium, Kansas City','scheduled',1051),
('Algeria','Norway','🇩🇿','🇳🇴','2026-06-21 23:00:00+00','Group I','Estadio Azteca, Mexico City','scheduled',1052),
('Norway','Iraq','🇳🇴','🇮🇶','2026-06-27 22:00:00+00','Group I','Lumen Field, Seattle','scheduled',1053),
('Algeria','France','🇩🇿','🇫🇷','2026-06-27 22:00:00+00','Group I','MetLife Stadium, New York','scheduled',1054),

-- GROUP J
('Argentina','Qatar','🇦🇷','🇶🇦','2026-06-17 19:00:00+00','Group J','Hard Rock Stadium, Miami','scheduled',1055),
('Ghana','Uzbekistan','🇬🇭','🇺🇿','2026-06-17 22:00:00+00','Group J','BC Place, Vancouver','scheduled',1056),
('Argentina','Ghana','🇦🇷','🇬🇭','2026-06-22 22:00:00+00','Group J','MetLife Stadium, New York','scheduled',1057),
('Uzbekistan','Qatar','🇺🇿','🇶🇦','2026-06-22 19:00:00+00','Group J','NRG Stadium, Houston','scheduled',1058),
('Qatar','Ghana','🇶🇦','🇬🇭','2026-06-28 02:00:00+00','Group J','Lincoln Financial Field, Philadelphia','scheduled',1059),
('Uzbekistan','Argentina','🇺🇿','🇦🇷','2026-06-28 02:00:00+00','Group J','Hard Rock Stadium, Miami','scheduled',1060),

-- GROUP K
('England','Croatia','🏴󠁧󠁢󠁥󠁮󠁧󠁿','🇭🇷','2026-06-17 22:00:00+00','Group K','AT&T Stadium, Dallas','scheduled',1061),
('Panama','Belgium','🇵🇦','🇧🇪','2026-06-18 01:00:00+00','Group K','Levi''s Stadium, San Francisco','scheduled',1062),
('England','Panama','🏴󠁧󠁢󠁥󠁮󠁧󠁿','🇵🇦','2026-06-23 01:00:00+00','Group K','SoFi Stadium, Los Angeles','scheduled',1063),
('Belgium','Croatia','🇧🇪','🇭🇷','2026-06-23 19:00:00+00','Group K','BC Place, Vancouver','scheduled',1064),
('Croatia','Panama','🇭🇷','🇵🇦','2026-06-28 22:00:00+00','Group K','Estadio Akron, Guadalajara','scheduled',1065),
('Belgium','England','🇧🇪','🏴󠁧󠁢󠁥󠁮󠁧󠁿','2026-06-28 22:00:00+00','Group K','Gillette Stadium, Boston','scheduled',1066),

-- GROUP L
('Uruguay','Cape Verde','🇺🇾','🇨🇻','2026-06-18 22:00:00+00','Group L','Estadio BBVA, Monterrey','scheduled',1067),
('Curaçao','Switzerland','🇨🇼','🇨🇭','2026-06-18 19:00:00+00','Group L','Arrowhead Stadium, Kansas City','scheduled',1068),
('Uruguay','Curaçao','🇺🇾','🇨🇼','2026-06-23 22:00:00+00','Group L','Estadio Azteca, Mexico City','scheduled',1069),
('Switzerland','Cape Verde','🇨🇭','🇨🇻','2026-06-24 01:00:00+00','Group L','Lumen Field, Seattle','scheduled',1070),
('Cape Verde','Curaçao','🇨🇻','🇨🇼','2026-06-29 02:00:00+00','Group L','NRG Stadium, Houston','scheduled',1071),
('Switzerland','Uruguay','🇨🇭','🇺🇾','2026-06-29 02:00:00+00','Group L','Estadio BBVA, Monterrey','scheduled',1072),

-- ══════════════════════════════════════════════════════════════
-- KNOCKOUT STAGE (32 matches — teams TBD)
-- ══════════════════════════════════════════════════════════════

-- ROUND OF 32 (16 matches, June 29 – July 4)
('TBD A1','TBD B2','🏳','🏳','2026-06-29 22:00:00+00','Round of 32','MetLife Stadium, New York','scheduled',2001),
('TBD C1','TBD D2','🏳','🏳','2026-06-30 01:00:00+00','Round of 32','AT&T Stadium, Dallas','scheduled',2002),
('TBD E1','TBD F2','🏳','🏳','2026-06-30 19:00:00+00','Round of 32','SoFi Stadium, Los Angeles','scheduled',2003),
('TBD G1','TBD H2','🏳','🏳','2026-06-30 22:00:00+00','Round of 32','NRG Stadium, Houston','scheduled',2004),
('TBD I1','TBD J2','🏳','🏳','2026-07-01 01:00:00+00','Round of 32','Levi''s Stadium, San Francisco','scheduled',2005),
('TBD K1','TBD L2','🏳','🏳','2026-07-01 19:00:00+00','Round of 32','Gillette Stadium, Boston','scheduled',2006),
('TBD B1','TBD A2','🏳','🏳','2026-07-01 22:00:00+00','Round of 32','Lincoln Financial Field, Philadelphia','scheduled',2007),
('TBD D1','TBD C2','🏳','🏳','2026-07-02 01:00:00+00','Round of 32','Estadio Azteca, Mexico City','scheduled',2008),
('TBD F1','TBD E2','🏳','🏳','2026-07-02 19:00:00+00','Round of 32','BC Place, Vancouver','scheduled',2009),
('TBD H1','TBD G2','🏳','🏳','2026-07-02 22:00:00+00','Round of 32','Lumen Field, Seattle','scheduled',2010),
('TBD J1','TBD I2','🏳','🏳','2026-07-03 01:00:00+00','Round of 32','Arrowhead Stadium, Kansas City','scheduled',2011),
('TBD L1','TBD K2','🏳','🏳','2026-07-03 19:00:00+00','Round of 32','Hard Rock Stadium, Miami','scheduled',2012),
('3rd 1','3rd 2','🏳','🏳','2026-07-03 22:00:00+00','Round of 32','Estadio BBVA, Monterrey','scheduled',2013),
('3rd 3','3rd 4','🏳','🏳','2026-07-04 01:00:00+00','Round of 32','MetLife Stadium, New York','scheduled',2014),
('3rd 5','3rd 6','🏳','🏳','2026-07-04 19:00:00+00','Round of 32','AT&T Stadium, Dallas','scheduled',2015),
('3rd 7','3rd 8','🏳','🏳','2026-07-04 22:00:00+00','Round of 32','SoFi Stadium, Los Angeles','scheduled',2016),

-- ROUND OF 16 (8 matches, July 5–8)
('R32 W1','R32 W2','🏳','🏳','2026-07-05 19:00:00+00','Round of 16','MetLife Stadium, New York','scheduled',3001),
('R32 W3','R32 W4','🏳','🏳','2026-07-05 22:00:00+00','Round of 16','AT&T Stadium, Dallas','scheduled',3002),
('R32 W5','R32 W6','🏳','🏳','2026-07-06 19:00:00+00','Round of 16','SoFi Stadium, Los Angeles','scheduled',3003),
('R32 W7','R32 W8','🏳','🏳','2026-07-06 22:00:00+00','Round of 16','NRG Stadium, Houston','scheduled',3004),
('R32 W9','R32 W10','🏳','🏳','2026-07-07 19:00:00+00','Round of 16','Levi''s Stadium, San Francisco','scheduled',3005),
('R32 W11','R32 W12','🏳','🏳','2026-07-07 22:00:00+00','Round of 16','Gillette Stadium, Boston','scheduled',3006),
('R32 W13','R32 W14','🏳','🏳','2026-07-08 19:00:00+00','Round of 16','Lincoln Financial Field, Philadelphia','scheduled',3007),
('R32 W15','R32 W16','🏳','🏳','2026-07-08 22:00:00+00','Round of 16','BC Place, Vancouver','scheduled',3008),

-- QUARTER-FINALS (4 matches, July 10–11)
('R16 W1','R16 W2','🏳','🏳','2026-07-10 19:00:00+00','Quarter-final','MetLife Stadium, New York','scheduled',4001),
('R16 W3','R16 W4','🏳','🏳','2026-07-10 22:00:00+00','Quarter-final','AT&T Stadium, Dallas','scheduled',4002),
('R16 W5','R16 W6','🏳','🏳','2026-07-11 19:00:00+00','Quarter-final','SoFi Stadium, Los Angeles','scheduled',4003),
('R16 W7','R16 W8','🏳','🏳','2026-07-11 22:00:00+00','Quarter-final','NRG Stadium, Houston','scheduled',4004),

-- SEMI-FINALS (2 matches, July 14–15)
('QF W1','QF W2','🏳','🏳','2026-07-14 23:00:00+00','Semi-final','AT&T Stadium, Dallas','scheduled',5001),
('QF W3','QF W4','🏳','🏳','2026-07-15 23:00:00+00','Semi-final','MetLife Stadium, New York','scheduled',5002),

-- THIRD PLACE (July 18)
('SF L1','SF L2','🏳','🏳','2026-07-18 23:00:00+00','Third place','Hard Rock Stadium, Miami','scheduled',6001),

-- FINAL (July 19)
('SF W1','SF W2','🏳','🏳','2026-07-19 22:00:00+00','Final','MetLife Stadium, New York','scheduled',7001)

ON CONFLICT (external_id) DO NOTHING;
