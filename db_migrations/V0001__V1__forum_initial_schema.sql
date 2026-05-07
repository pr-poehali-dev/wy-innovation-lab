
CREATE TABLE IF NOT EXISTS forum_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_color VARCHAR(20) DEFAULT '#FF4500',
  bio TEXT DEFAULT '',
  karma INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_sessions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES forum_users(id),
  token VARCHAR(128) UNIQUE NOT NULL,
  last_seen TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_posts (
  id SERIAL PRIMARY KEY,
  author_id INT REFERENCES forum_users(id),
  title VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'Общее',
  tag VARCHAR(50) DEFAULT 'Обсуждение',
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_likes (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES forum_users(id),
  post_id INT REFERENCES forum_posts(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE TABLE IF NOT EXISTS forum_comments (
  id SERIAL PRIMARY KEY,
  post_id INT REFERENCES forum_posts(id),
  author_id INT REFERENCES forum_users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_messages (
  id SERIAL PRIMARY KEY,
  sender_id INT REFERENCES forum_users(id),
  receiver_id INT REFERENCES forum_users(id),
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_reports (
  id SERIAL PRIMARY KEY,
  reporter_id INT REFERENCES forum_users(id),
  post_id INT REFERENCES forum_posts(id),
  reason VARCHAR(200) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
