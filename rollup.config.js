import { spawn } from 'child_process';

import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import builtinModules from 'builtin-modules';
import electron from 'electron';
import copy from 'rollup-plugin-copy';

import appManifest from './package.json';

const NODE_ENV = process.env.NODE_ENV || 'development';
const canRun =
  process.env.ROLLUP_WATCH === 'true' && process.env.NO_RUN !== 'true';

const run = () => {
  if (!canRun) {
    return;
  }

  let proc = null;

  return {
    writeBundle: async () => {
      if (proc) {
        proc.kill();
        await new Promise((resolve) => proc.on('close', resolve));
      }

      console.log(
        proc ? 'Restarting main process...' : 'Starting main process...'
      );

      proc = spawn(electron, ['.'], { stdio: 'inherit' });

      proc.on('close', () => {
        proc = null;
      });
    },
  };
};

const tsconfig = {
  noEmitOnError: false,
  exclude: ['src/**/*.spec.ts', 'src/.jest'],
};

export default [
  {
    external: [
      ...builtinModules,
      ...Object.keys(appManifest.dependencies),
      ...Object.keys(appManifest.devDependencies),
    ].filter((moduleName) => moduleName !== '@bugsnag/js'),
    input: 'src/videoCallWindow/video-call-window.tsx',
    preserveEntrySignatures: 'strict',
    plugins: [
      json(),
      replace({
        'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
        'preventAssignment': true,
      }),
      typescript(tsconfig),
      babel({
        babelHelpers: 'bundled',
      }),
      nodeResolve({
        browser: true,
      }),
      commonjs(),
    ],
    output: [
      {
        dir: 'app',
        format: 'cjs',
        sourcemap: 'inline',
      },
    ],
  },
  {
    external: [
      ...builtinModules,
      ...Object.keys(appManifest.dependencies),
      ...Object.keys(appManifest.devDependencies),
    ].filter((moduleName) => moduleName !== '@bugsnag/js'),
    input: 'src/rootWindow.ts',
    preserveEntrySignatures: 'strict',
    plugins: [
      json(),
      replace({
        'process.env.ELECTRON_WEBCLIENT_PORT': JSON.stringify(
          process.env.ELECTRON_WEBCLIENT_PORT || 4000
        ),
        'process.env.BUGSNAG_API_KEY': JSON.stringify(
          process.env.BUGSNAG_API_KEY
        ),
        'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
        'preventAssignment': true,
      }),
      typescript(tsconfig),
      babel({
        babelHelpers: 'bundled',
      }),
      nodeResolve({
        browser: true,
      }),
      commonjs(),
    ],
    output: {
      dir: 'app',
      format: 'cjs',
      inlineDynamicImports: true,
      sourcemap: true,
    },
  },
  {
    external: [
      ...builtinModules,
      ...Object.keys(appManifest.dependencies),
      ...Object.keys(appManifest.devDependencies),
    ].filter((moduleName) => moduleName !== '@bugsnag/js'),
    input: 'src/preload.ts',
    plugins: [
      json(),
      replace({
        'process.env.ELECTRON_WEBCLIENT_PORT': JSON.stringify(
          process.env.ELECTRON_WEBCLIENT_PORT || 4000
        ),
        'process.env.BUGSNAG_API_KEY': JSON.stringify(
          process.env.BUGSNAG_API_KEY
        ),
        'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
        'preventAssignment': true,
      }),
      typescript(tsconfig),
      babel({
        babelHelpers: 'bundled',
      }),
      nodeResolve({
        browser: true,
      }),
      commonjs(),
    ],
    output: [
      {
        dir: 'app',
        format: 'cjs',
        sourcemap: 'inline',
      },
    ],
  },
  {
    input: 'src/injected.ts',
    plugins: [
      json(),
      replace({
        'process.env.ELECTRON_WEBCLIENT_PORT': JSON.stringify(
          process.env.ELECTRON_WEBCLIENT_PORT || 4000
        ),
        'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
        'preventAssignment': true,
      }),
      typescript(tsconfig),
      babel({
        babelHelpers: 'bundled',
      }),
      nodeResolve({
        browser: true,
      }),
      commonjs(),
    ],
    output: [
      {
        dir: 'app',
        format: 'iife',
        sourcemap: 'inline',
      },
    ],
  },
  {
    external: [
      ...builtinModules,
      ...Object.keys(appManifest.dependencies),
      ...Object.keys(appManifest.devDependencies),
    ],
    input: 'src/main.ts',
    plugins: [
      copy({
        targets: [
          { src: 'src/public/*', dest: 'app' },
          { src: 'node_modules/@rocket.chat/icons/dist/*', dest: 'app/icons' },
        ],
      }),
      json(),
      replace({
        'process.env.ELECTRON_WEBCLIENT_PORT': JSON.stringify(
          process.env.ELECTRON_WEBCLIENT_PORT || 4000
        ),
        'process.env.BUGSNAG_API_KEY': JSON.stringify(
          process.env.BUGSNAG_API_KEY
        ),
        'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
        'preventAssignment': true,
      }),
      typescript(tsconfig),
      babel({
        babelHelpers: 'bundled',
      }),
      nodeResolve(),
      commonjs(),
      run(),
    ],
    output: {
      dir: 'app',
      format: 'cjs',
      sourcemap: 'inline',
    },
  },
];
