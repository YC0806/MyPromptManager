/* Build bundles for the extension using esbuild */
const path = require('path');
const { build } = require('esbuild');

const isProd = process.env.NODE_ENV === 'production';

const common = {
  bundle: true,
  sourcemap: !isProd,
  target: ['chrome114'],
  minify: isProd,
  legalComments: 'none',
};

const entryPoints = {
  background: path.join(__dirname, '..', 'src', 'background', 'index.ts'),
  content: path.join(__dirname, '..', 'src', 'content', 'index.ts'),
  popup: path.join(__dirname, '..', 'src', 'popup', 'index.js'),
};

async function run() {
  const tasks = Object.entries(entryPoints).map(([name, entry]) => {
    return build({
      ...common,
      entryPoints: [entry],
      outfile: path.join(__dirname, '..', 'dist', `${name}.js`),
      format: 'iife',
      logLevel: 'info',
    });
  });

  await Promise.all(tasks);
  console.log(`Build complete (${isProd ? 'production' : 'development'} mode).`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
