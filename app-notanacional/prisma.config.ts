const config = {
  schema: "./prisma/schema.prisma",
  datasource: {
    db: {
      provider: "mysql",
      url: process.env.DATABASE_URL,
    },
  },
};

export default config;
