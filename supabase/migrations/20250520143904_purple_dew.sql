/*
  # Create playlists and user_playlists tables

  1. New Tables
    - `playlists`
      - `id` (uuid, primary key)
      - `name` (text)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `playlist_items`
      - `id` (uuid, primary key)
      - `playlist_id` (uuid, references playlists)
      - `name` (text)
      - `type` (text)
      - `url` (text)
      - `thumbnail` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own playlists
*/

CREATE TABLE playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE playlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid REFERENCES playlists ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  url text NOT NULL,
  thumbnail text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own playlists"
  ON playlists
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage items in their playlists"
  ON playlist_items
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM playlists 
    WHERE playlists.id = playlist_items.playlist_id 
    AND playlists.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM playlists 
    WHERE playlists.id = playlist_items.playlist_id 
    AND playlists.user_id = auth.uid()
  ));