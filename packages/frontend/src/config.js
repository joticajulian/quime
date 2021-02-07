const server = process.env.SERVER || "http://localhost:8081";

const config = {
  production: {
    api: "/api",
    serverRecords: "/api/records",
    serverLogin: "/login",
  },
  development: {
    api: `${server}/api`,
    serverRecords: `${server}/api/records`,
    serverLogin: `${server}/login`,
  }
}

const environment = process.env.NODE_ENV;
const finalConfig = config[environment];

export default{
  ...finalConfig,
}
