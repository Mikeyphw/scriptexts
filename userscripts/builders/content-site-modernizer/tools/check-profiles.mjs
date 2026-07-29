#!/usr/bin/env node
import builder from '../scripts.config.mjs';
import { PROFILE_SCHEMA_VERSION, validateBuilderConfig } from '../src/core/profile-schema.mjs';

try {
  const profiles = validateBuilderConfig(builder);
  console.log(`content-site profile schema v${PROFILE_SCHEMA_VERSION} ok: ${profiles.length} profiles`);
  for (const profile of profiles) {
    const caps = Object.entries(profile.client.capabilities)
      .filter(([, enabled]) => enabled)
      .map(([name]) => name)
      .join(',');
    console.log(`- ${profile.id} ${profile.version} capabilities=${caps}`);
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
