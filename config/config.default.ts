import { EggAppConfig, EggAppInfo, PowerPartial } from 'egg';
import * as dotenv from 'dotenv';
dotenv.config();
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
  config.redis = {
    client: {
      port: 6379,
      host: '127.0.0.1',
      password: '',
      db: 0,
    },
  };
  //gitee oauth config
  const giteeOauthConfig = {
    cid: process.env.GITEE_CID,
    secret: process.env.GITEE_SECRET,
    redirectURL: 'http://127.0.0.1:7001/api/users/passport/gitee/callback',
    authURL: 'https://gitee.com/oauth/token?grant_type=authorization_code',
    giteeUserApi: 'https://gitee.com/api/v5/user',
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
    giteeOauthConfig,
  };

  // the return config will combines to EggAppConfig
  return {
    ...(config as {}),
    ...bizConfig,
  };
};
