import {FlatCompat} from '@eslint/eslintrc';
import {fileURLToPath} from 'url';
import path from 'path';

const baseDirectory=path.dirname(fileURLToPath(import.meta.url));
const compat=new FlatCompat({baseDirectory});

export default [
  {ignores:['.next/**','node_modules/**','diagnostics/**','public/**']},
  ...compat.extends('next/core-web-vitals')
];
