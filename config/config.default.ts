import { EggAppConfig, EggAppInfo, PowerPartial } from 'egg';
import { join } from 'path';
import * as dotenv from 'dotenv';
dotenv.config();
export default (appInfo: EggAppInfo) => {
  const config = {} as PowerPartial<EggAppConfig>;

  // override config from framework / plugin
  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1659232540970_2598';

  // add your egg config in here
  // config.middleware = ['customError'];
  config.security = {
    csrf: {
      enable: false
    }
  };
  config.mongoose = {
    url: 'mongodb://localhost:27017/lego',
    // options: {
    //   user: 'legoAdmin',
    //   pass: '123456',
    //   useUnifiedTopology: true
    // }
  };
  config.bcrypt = {
    saltRounds: 10
  };
  config.jwt = {
    secret: process.env.JWT_SECRET || '',
    enable: true,
    match: [
      '/api/users/getUserInfo',
      '/api/works',
      '/api/utils/upload-img',
      '/api/channel'
    ]
  };
  config.view = {
    defaultViewEngine: 'nunjucks'
  };
  config.redis = {
    client: {
      port: 6379,
      host: '127.0.0.1',
      password: '',
      db: 0
    }
  };
  config.cors = {
    origin: 'http://localhost:8080',
    allowMethods: 'GET,HEAD,PUT,OPTIONS,POST,DELETE,PATCH'
  };
  // config.multipart = {
  //   mode: 'file',
  //   tmpdir: join(appInfo.baseDir, 'uploads'),
  // };
  config.static = {
    dir: [
      { prefix: '/public', dir: join(appInfo.baseDir, 'app/public') },
      { prefix: '/uploads', dir: join(appInfo.baseDir, 'uploads') }
    ]
  };
  config.multipart = {
    whitelist: ['.png', '.jpg', '.gif', '.webp'],
    fileSize: '1mb'
  };
  config.oss = {
    client: {
      accessKeyId: process.env.ALC_ACCESS_KEY || '',
      accessKeySecret: process.env.ALC_SECRET_KEY || '',
      bucket: 'keep-lego-back',
      endpoint: process.env.OSS_ENDPOINT || '',
      timeout: '60s'
    }
  };
  // gitee oauth config
  const giteeOauthConfig = {
    cid: process.env.GITEE_CID,
    secret: process.env.GITEE_SECRET,
    redirectURL: 'http://127.0.0.1:7001/api/users/passport/gitee/callback',
    authURL: 'https://gitee.com/oauth/token?grant_type=authorization_code',
    giteeUserApi: 'https://gitee.com/api/v5/user'
  };
  // add your special config in here
  const bizConfig = {
    sourceUrl: `https://github.com/eggjs/examples/tree/master/${appInfo.name}`,
    myLogger: {
      allowedMethod: ['POST']
    },
    baseUrl: 'default.url',
    // jwt: {
    //   secret: 'keep18232079049',
    // },
    giteeOauthConfig,
    H5BaseURL: 'http://localhost:7001/api/pages'
  };

  // the return config will combines to EggAppConfig
  return {
    ...(config as {}),
    ...bizConfig
  };
};
