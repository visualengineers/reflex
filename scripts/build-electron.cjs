const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const [application, platform, arch, ...options] = process.argv.slice(2);
const platforms = { win: 'win', osx: 'mac', linux: 'linux' };
if (!['emulator', 'server'].includes(application) || !platforms[platform] || !['x64', 'arm64'].includes(arch)
    || options.some(option => option !== '--dir')) {
  throw new Error('Usage: build-electron.cjs <emulator|server> <win|osx|linux> <x64|arm64> [--dir]');
}
if (platform === 'osx' && process.platform !== 'darwin') throw new Error('macOS applications must be packaged on macOS.');

function run(command, args, cwd = root, env = process.env) {
  const result = spawnSync(command, args, { cwd, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed (${result.status ?? result.signal}).`);
}
function npm(args) {
  if (!process.env.npm_execpath) throw new Error('Run this build through an npm script.');
  run(process.execPath, [process.env.npm_execpath, ...args]);
}

try {
  if (application === 'server') run('dotnet', ['--version']);
  npm(['run', 'build:shared-types']);
  const output = application === 'emulator'
    ? path.join(root, 'tools/emulator/release')
    : path.join(root, 'tools/ReFlex.TrackingServer/bin/Desktop');
  const unpacked = platform === 'osx' ? (arch === 'arm64' ? 'mac-arm64' : 'mac')
    : platform === 'win' ? (arch === 'arm64' ? 'win-arm64-unpacked' : 'win-unpacked')
      : (arch === 'arm64' ? 'linux-arm64-unpacked' : 'linux-unpacked');
  // Electron.NET 23 does not propagate electron-builder's exit code. Remove the
  // previous unpacked app so a failed packaging step cannot reuse stale output.
  fs.rmSync(path.join(output, unpacked), { recursive: true, force: true });

  if (application === 'emulator') {
    npm(['run', 'build', '--workspace=tools/emulator', '--', '--base-href', './']);
    const app = path.join(root, 'tools/emulator');
    const stage = path.join(app, '.electron-app');
    fs.rmSync(stage, { recursive: true, force: true });
    fs.mkdirSync(stage, { recursive: true });
    const original = JSON.parse(fs.readFileSync(path.join(app, 'package.json')));
    // Angular bundles all renderer dependencies. Only Electron and Node builtins
    // are required at runtime; never install/prune dependencies in the workspace.
    fs.writeFileSync(path.join(stage, 'package.json'), JSON.stringify({
      name: 'reflex-emulator', version: original.version, main: 'main.js',
      author: original.author, description: original.description,
      build: { ...original.build, directories: { ...original.build.directories, output } }
    }, null, 2));
    fs.copyFileSync(path.join(app, 'main.js'), path.join(stage, 'main.js'));
    fs.cpSync(path.join(app, 'dist'), path.join(stage, 'dist'), { recursive: true });
    run(process.execPath, [path.join(root, 'node_modules/electron-builder/cli.js'),
      '--projectDir', stage, `--${platforms[platform]}`, `--${arch}`, '--publish=never', ...options]);
  } else {
    npm(['run', 'build:shared-components']);
    npm(['run', 'build:server']);
    const server = path.join(root, 'tools/ReFlex.TrackingServer');
    // Use the repository-local CLI, pinned to the ElectronNET.API version.
    run('dotnet', ['tool', 'restore'], root, { ...process.env, DOTNET_ROLL_FORWARD: 'Major' });
    run('dotnet', ['tool', 'run', 'electronize', '--', 'build',
      '/target', 'custom', `${platform}-${arch};${platforms[platform]}`,
      '/electron-arch', arch, '/dotnet-configuration', 'Release',
      `/p:Platform=${arch === 'arm64' ? 'ARM64' : 'x64'}`,
      '/p:SkipSpaBuild=true',
      '/PublishSingleFile', 'false', '/PublishReadyToRun', 'false',
      '/electron-params', '--publish=never --dir'
    ], server, { ...process.env, DOTNET_ROLL_FORWARD: 'Major' });
    if (!options.includes('--dir')) {
      // Run the installer step ourselves so electron-builder failures propagate.
      const host = path.join(server, 'obj/desktop/custom');
      run(process.execPath, [path.join(root, 'node_modules/electron-builder/cli.js'),
        '--projectDir', host, '--config', path.join(host, 'bin/electron-builder.json'),
        `--${platforms[platform]}`, `--${arch}`, '--publish=never']);
    }
  }

  const product = application === 'emulator' ? 'ReFlex Emulator' : 'ReFlex TrackingServer';
  const folder = path.join(output, unpacked);
  const candidates = platform === 'osx' ? [path.join(folder, `${product}.app`, 'Contents/MacOS', product)]
    : platform === 'win' ? [path.join(folder, `${product}.exe`)]
      : [path.join(folder, product), path.join(folder, application === 'emulator' ? 'reflex-emulator' : 'reflex.trackingserver')];
  const executable = candidates.find(file => fs.existsSync(file));
  if (!executable) throw new Error(`Packaged executable missing: ${candidates.join(', ')}`);
  fs.writeFileSync(path.join(output, 'smoke-target.json'), JSON.stringify({ application, platform, arch, executable }, null, 2));
  console.log(`Packaged ${application}: ${executable}`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
