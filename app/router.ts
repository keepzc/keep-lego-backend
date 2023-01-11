import { Application } from 'egg';

export default (app: Application) => {
  const { controller, router } = app;
  // const logger = app.middleware.myLogger({
  //   allowedMethod: ['GET'],
  // });
  // const jwt = app.middleware.jwt({
  //   secret: app.config.jwt.secret,
  // });
  // const jwtMiddleware = app.jwt as any;

  router.prefix('/api');
  router.get('/ping', controller.home.index);
  router.post('/users/create', controller.user.createByEmail);
  router.post('/users/loginByEmail', controller.user.loginByEmail);
  // router.get('/users/:id', controller.user.show);
  router.get('/users/getUserInfo', controller.user.show);
  router.post('/users/genVeriCode', controller.user.sendVeriCode);
  router.post('/users/loginByPhoneNumber', controller.user.loginByCellphone);
  router.get('/users/passport/gitee', controller.user.oauth);
  router.get('/users/passport/gitee/callback', controller.user.oauthByGitee);

  router.post('/works', controller.work.createWork);
  router.post('/works/copy/:id', controller.work.copyWork);
  router.get('/works', controller.work.myList);
  router.get('/works/:id', controller.work.myWork);
  router.get('/templates', controller.work.templateList);
  router.get('/templates/:id', controller.work.template);
  router.patch('/works/:id', controller.work.update);
  router.delete('/works/:id', controller.work.delete);
  router.post('/works/publish/:id', controller.work.publishWork);
  router.post('/works/publish-template/:id', controller.work.publishTemplate);

  router.post('/utils/upload-img', controller.utils.uploadMutipleFiles);
  router.get('/pages/:idAndUuid', controller.utils.renderH5Page);
  router.post('/channel', controller.work.createChannel);
  router.get('/channel/getWorkChannels/:id', controller.work.getWorkChannel);
  router.patch('/channel/updateName/:id', controller.work.updateChannelName);
  router.delete('/channel/:id', controller.work.deleteChannel);
};
