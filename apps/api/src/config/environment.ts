import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const environmentFile = resolve(process.cwd(), '.env');

if (existsSync(environmentFile)) {
  process.loadEnvFile(environmentFile);
}

export const jwtSecret = process.env.JWT_SECRET ?? 'academy-secret';
export const refreshSecret = process.env.REFRESH_SECRET;
