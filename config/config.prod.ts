import { EggAppConfig, PowerPartial } from 'egg';

export default () => {
  const config: PowerPartial<EggAppConfig> = {};
  config.baseUrl = 'prod.url';
  config.mongoose = {
    url: 'mongodb://lego-mongo:27017/lego',
    options: {
      user: process.env.MONGO_DB_USERNAME,
      pass: process.env.MONGO_DB_PASSWORD,
      useUnifiedTopology: true
    }
  };
  config.redis = {
    client: {
      port: 6379,
      host: 'lego-redis',
      password: process.env.REDIS_PASSWORD
    }
  };
  config.H5BaseURL = 'http://47.93.58.48:7002'
  return config;
};
