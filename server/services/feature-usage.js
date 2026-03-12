const fs = require('fs/promises');
const path = require('path');

const DEFAULT_CACHE_MS = 30_000;

let cache = {
    usedKeys: null,
    lastComputedAt: 0
};

async function walkFiles(rootDir, allowedExtensions) {
    const entries = await fs.readdir(rootDir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const fullPath = path.join(rootDir, entry.name);

        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === '.git') continue;
            files.push(...await walkFiles(fullPath, allowedExtensions));
            continue;
        }

        const ext = path.extname(entry.name).toLowerCase();
        if (allowedExtensions.has(ext)) files.push(fullPath);
    }

    return files;
}

function collectKeysFromText(text, outSet) {
    const dataFeatureRe = /data-feature(?:-disabled)?\s*=\s*["']([^"']+)["']/gi;
    const isEnabledRe = /\bisEnabled\s*\(\s*["']([^"']+)["']\s*\)/g;

    for (const re of [dataFeatureRe, isEnabledRe]) {
        let match;
        while ((match = re.exec(text)) !== null) {
            const key = (match[1] || '').trim();
            if (key) outSet.add(key);
        }
    }
}

async function computeUsedFeatureKeys({ projectRoot }) {
    const usedKeys = new Set();
    const publicDir = path.join(projectRoot, 'public');

    const files = await walkFiles(publicDir, new Set(['.html', '.js']));

    for (const filePath of files) {
        // Admin page includes feature keys for display; ignore it so it doesn't self-contaminate.
        if (path.basename(filePath) === 'admin-features.html') continue;

        try {
            const text = await fs.readFile(filePath, 'utf8');
            collectKeysFromText(text, usedKeys);
        } catch {
            // Ignore unreadable files
        }
    }

    return usedKeys;
}

async function getUsedFeatureKeys({ cacheMs = DEFAULT_CACHE_MS } = {}) {
    const now = Date.now();
    if (cache.usedKeys && now - cache.lastComputedAt < cacheMs) {
        return cache.usedKeys;
    }

    const projectRoot = path.resolve(__dirname, '../..');
    const usedKeys = await computeUsedFeatureKeys({ projectRoot });

    cache = {
        usedKeys,
        lastComputedAt: now
    };

    return usedKeys;
}

module.exports = {
    getUsedFeatureKeys
};
