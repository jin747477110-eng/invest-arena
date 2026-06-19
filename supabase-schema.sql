-- 在 Supabase SQL Editor 中运行以下全部内容
-- 打开: https://supabase.com/dashboard/project/ynvqbbngmirvtmpnfepe/sql/new

-- 1. 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  nickname TEXT DEFAULT '未命名选手',
  password TEXT NOT NULL,
  bio TEXT DEFAULT '个性签名未设置',
  initCapital INTEGER DEFAULT 10000,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建报数表
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  userId TEXT REFERENCES users(id),
  date DATE NOT NULL,
  totalAsset FLOAT NOT NULL,
  note TEXT DEFAULT '',
  createdAt TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 创建设置表
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  seasonStart TEXT DEFAULT '2026-07-01',
  seasonEnd TEXT DEFAULT '2026-09-30'
);

-- 4. 插入初始用户数据
INSERT INTO users (id, slug, name, nickname, password, bio, initCapital) VALUES
  ('user1', 'player1', '选手一', '待定选手1', '123456', '个性签名未设置', 10000),
  ('user2', 'player2', '选手二', '待定选手2', '123456', '个性签名未设置', 10000),
  ('user3', 'player3', '选手三', '待定选手3', '123456', '个性签名未设置', 10000),
  ('user4', 'player4', '选手四', '待定选手4', '123456', '个性签名未设置', 10000)
ON CONFLICT (id) DO NOTHING;

-- 5. 插入默认设置
INSERT INTO settings (id, seasonStart, seasonEnd) VALUES
  (1, '2026-07-01', '2026-09-30')
ON CONFLICT (id) DO NOTHING;

-- 6. 关闭 RLS（简化权限，这是4人私密项目）
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
