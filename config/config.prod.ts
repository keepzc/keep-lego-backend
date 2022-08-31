import { EggAppConfig, PowerPartial } from 'egg';

export default () => {
  const config: PowerPartial<EggAppConfig> = {};
  config.baseUrl = 'prod.url';
  config.mongoose = {
    url: 'mongodb://lego-mongo:27017/lego'
  };
  return config;
};
