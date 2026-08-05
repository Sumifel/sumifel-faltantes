import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    url: "postgresql://neondb_owner:npg_pa6VZGSU8tcK@ep-spring-salad-aynhrwqw-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  },
});