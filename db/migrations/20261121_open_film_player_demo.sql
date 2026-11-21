-- Register the freely licensed player sample and its territory permission.
ALTER TABLE nexora_playback_assets DROP CONSTRAINT nexora_playback_assets_asset_type_check;
ALTER TABLE nexora_playback_assets ADD CONSTRAINT nexora_playback_assets_asset_type_check CHECK (asset_type IN ('hls','dash','mp4','webm','poster','backdrop','trailer','subtitle'));
ALTER TABLE nexora_content_rights ADD COLUMN IF NOT EXISTS demo_allowed BOOLEAN NOT NULL DEFAULT FALSE;
INSERT INTO nexora_content(id,content_type,title,synopsis,release_year,original_language,production_country,status)
VALUES('big-buck-bunny-demo','movie','Big Buck Bunny · Player Preview','A short, openly licensed animation clip used to demonstrate Nexora playback controls.',2008,'en','NL','published')
ON CONFLICT(id) DO UPDATE SET status='published',updated_at=NOW();
INSERT INTO nexora_content_rights(id,content_id,territory,license_reference,starts_at,svod_allowed,avod_allowed,demo_allowed,status)
VALUES('bbb-cc-by-ng','big-buck-bunny-demo','NG','CC BY 3.0 · Blender Foundation · peach.blender.org/about','2008-05-30T00:00:00Z',FALSE,FALSE,TRUE,'active')
ON CONFLICT(id) DO NOTHING;
INSERT INTO nexora_playback_assets(id,content_id,asset_type,storage_key,mime_type,duration_seconds,status,drm_required)
VALUES
('bbb-demo-av1','big-buck-bunny-demo','webm','https://download.blender.org/demo/movies/BBB/bbb_1080p_10s_5MB_av1.webm','video/webm',10,'ready',FALSE),
('bbb-demo-mp4','big-buck-bunny-demo','mp4','https://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_320x180.mp4','video/mp4',10,'ready',FALSE)
ON CONFLICT(content_id,asset_type,storage_key) DO NOTHING;
