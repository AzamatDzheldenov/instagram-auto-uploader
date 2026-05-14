const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '..', 'content');

const CONTENT_TYPES = {
  reels: { dir: 'reels', extensions: ['.mp4', '.mov'] },
  carousel: { dir: 'carousel', extensions: ['.jpg', '.jpeg', '.png', '.mp4'] },
  posts: { dir: 'posts', extensions: ['.jpg', '.jpeg', '.png'] },
};

function readMetadata(filePath) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath, path.extname(filePath));
  const metaPath = path.join(dir, `${base}.metadata.json`);

  if (fs.existsSync(metaPath)) {
    return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  }

  // Fallback: общий metadata.json в папке
  const folderMeta = path.join(dir, 'metadata.json');
  if (fs.existsSync(folderMeta)) {
    return JSON.parse(fs.readFileSync(folderMeta, 'utf8'));
  }

  return { caption: '' };
}

function getContentItems(type) {
  const config = CONTENT_TYPES[type];
  if (!config) throw new Error(`Неизвестный тип контента: ${type}`);

  const dir = path.join(CONTENT_DIR, config.dir);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter(f =>
    config.extensions.includes(path.extname(f).toLowerCase())
  );

  return files.map(file => {
    const filePath = path.join(dir, file);
    const metadata = readMetadata(filePath);
    return { filePath, fileName: file, metadata, type };
  });
}

function getAllContent() {
  return {
    reels: getContentItems('reels'),
    carousel: getContentItems('carousel'),
    posts: getContentItems('posts'),
  };
}

module.exports = { getAllContent, getContentItems, readMetadata };