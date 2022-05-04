import { DEFAULT_EXTENSIONS } from '@babel/core';
import babel from '@rollup/plugin-babel';
import typescript from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs';
import external from 'rollup-plugin-peer-deps-external';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import typescriptEngine from 'typescript';
import pkg from './package.json';

const config = {
    input: 'src/index.js',
    output: [
        {
            file: pkg.main,
            format: 'cjs',
            exports: 'named',
        }
    ],
    plugins: [
        external({
            includeDependencies: true,
        }),
        typescript({
            typescript: typescriptEngine,
            include: ['*.js+(|x)', '**/*.js+(|x)'],
            exclude: ['coverage', 'config', 'dist', 'node_modules/**', '*.test.{js+(|x), ts+(|x)}', '**/*.test.{js+(|x), ts+(|x)}'],
        }),
        commonjs(),
        babel({
            extensions: [...DEFAULT_EXTENSIONS],
            babelHelpers: 'runtime',
            exclude: /node_modules/,
        }),
        resolve(),
        terser(),
    ],
};

export default config;
