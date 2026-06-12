-- Demo seed: run AFTER first user registers and creates a band,
-- OR adapt band_id to your test group.
--
-- Example: replace :band_id with your band UUID from `select id from bands limit 1`

-- Uncomment and set your band_id to seed demo content:
/*
DO $$
DECLARE
  v_band_id UUID := '00000000-0000-0000-0000-000000000001'; -- CHANGE ME
  v_song1 UUID;
  v_song2 UUID;
  v_song3 UUID;
  v_setlist UUID;
BEGIN
  INSERT INTO songs (band_id, title, status, bpm, key, duration_sec, song_type, genre, structure, sort_order)
  VALUES
    (v_band_id, 'Night Drive', 'ready', 128, 'Em', 252, 'original', 'Alt-rock',
     'Intro → Verse → Chorus → Solo → Verse → Chorus → Outro', 1),
    (v_band_id, 'Echoes', 'in_progress', 94, 'Am', 330, 'original', 'Alt-rock',
     'Intro → Verse → Chorus → Bridge → Chorus → Outro', 2),
    (v_band_id, 'Dead Signals', 'ready', 110, 'Dm', 238, 'original', 'Alt-rock',
     'Intro → Verse → Chorus → Solo → Outro', 3)
  RETURNING id INTO v_song1;

  SELECT id INTO v_song2 FROM songs WHERE band_id = v_band_id AND title = 'Echoes';
  SELECT id INTO v_song3 FROM songs WHERE band_id = v_band_id AND title = 'Dead Signals';

  INSERT INTO song_contents (song_id, content_type, instrument, body) VALUES
    (v_song1, 'chords', NULL, 'Em — C — G — D'),
    (v_song1, 'lyrics', NULL, E'[Куплет]\nНочной асфальт под колёсами\nГород спит, а мы не спим'),
    (v_song1, 'tabs', 'bass', E'G|----------------|\nD|----------------|\nA|--2---0---------|\nE|--------3---0---|'),
    (v_song2, 'chords', NULL, 'Am — F — C — G'),
    (v_song2, 'lyrics', NULL, E'[Куплет]\nЭхо в пустом зале...'),
    (v_song3, 'chords', NULL, 'Dm — Bb — F — C');

  INSERT INTO setlists (band_id, name) VALUES (v_band_id, 'Концерт — демо')
  RETURNING id INTO v_setlist;

  INSERT INTO setlist_items (setlist_id, song_id, position, notes) VALUES
    (v_setlist, v_song1, 1, NULL),
    (v_setlist, v_song3, 2, NULL),
    (v_setlist, v_song2, 3, NULL);

  INSERT INTO events (band_id, event_type, title, starts_at, location, setlist_id, notes) VALUES
    (v_band_id, 'rehearsal', 'Репетиция #1', now() + interval '2 days', 'Red Room Studio', NULL,
     'Прогон Night Drive и Echoes'),
    (v_band_id, 'performance', 'Клуб Б2', now() + interval '14 days', 'Москва, ул. Малая Ордынка', v_setlist,
     'Live выступление');

  INSERT INTO todos (band_id, title, is_done, position) VALUES
    (v_band_id, 'Записать бас-партии', false, 1),
    (v_band_id, 'Фотосессия', false, 2),
    (v_band_id, 'Обложка EP', false, 3),
    (v_band_id, 'Договор с клубом', true, 4);
END $$;
*/
