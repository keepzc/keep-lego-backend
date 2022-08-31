import { IBoot, Application } from 'egg';
// import { createConnection } from 'mongoose';
// import { join } from 'path';
// import assert from 'assert';
export default class AppBoot implements IBoot {
  private readonly app: Application;

  constructor(app: Application) {
    this.app = app;
    // const { url } = this.app.config.mongoose;
    // assert(url, '[egg-mongoose] url is required on config');
    // const db = createConnection(url);
    // db.on('connected', () => {
    //   app.logger.info(`[egg-mongoose]${url} connected successfully`);
    // });
    // app.mongoose = db;
  }

  configWillLoad() {
    // 只是支持同步调用
    // console.log('config', this.app.config.baseUrl);
    // console.log('enable middleware', this.app.config.coreMiddleware);
    // this.app.config.coreMiddleware.unshift('myLogger');
    // 添加 customError 中间件提前
    this.app.config.coreMiddleware.push('customError');
  }

  async willReady() {
    // console.log('will middleware', this.app.config.coreMiddleware);
    // const dir = join(this.app.config.baseDir, 'app/model');
    // console.log(dir, '---');
    // this.app.loader.loadToApp(dir, 'model', { caseStyle: 'upper' });
  }

  async didLoad() {
    // 应用已经启动完毕
    // const ctx = await this.app.createAnonymousContext();
    // const res = await ctx.service.test.sayHi('keep');
    // console.log('did ready res', res);
    // console.log('did middleware', this.app.middleware);
  }
  async didReady() {
    console.log('middleware', this.app.middleware);
  }
}
