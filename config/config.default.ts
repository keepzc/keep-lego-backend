import { EggAppConfig, EggAppInfo, PowerPartial } from 'egg';

export default (appInfo: EggAppInfo) => {
  const config = {} as PowerPartial<EggAppConfig>;

  // override config from framework / plugin
  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1659232540970_2598';

  // add your egg config in here
  config.middleware = ['customError'];
  config.security = {
    csrf: {
      enable: false,
    },
  };
  config.mongoose = {
    url: 'mongodb://admin:123456@localhost:27017/lego?authSource=admin',
  };
  config.bcrypt = {
    saltRounds: 10,
  };
  config.jwt = {
    secret: 'keep18232079049',
  };
  config.view = {
    defaultViewEngine: 'nunjucks',
  };
  // add your special config in here
  const bizConfig = {
    sourceUrl: `https://github.com/eggjs/examples/tree/master/${appInfo.name}`,
    myLogger: {
      allowedMethod: ['POST'],
    },
    baseUrl: 'default.url',
    // jwt: {
    //   secret: 'keep18232079049',
    // },
  };

  // the return config will combines to EggAppConfig
  return {
    ...(config as {}),
    ...bizConfig,
  };
};
