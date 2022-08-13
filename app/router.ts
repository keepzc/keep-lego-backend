import { Application } from 'egg';

export default (app: Application) => {
  const { controller, router } = app;
  // const logger = app.middleware.myLogger({
  //   allowedMethod: ['GET'],
  // });
  // const jwt = app.middleware.jwt({
  //   secret: app.config.jwt.secret,
  // });
  const jwtMiddleware = app.jwt as any;

  router.get('/', controller.home.index);
  router.post('/api/users/create', controller.user.createByEmail);
  router.post('/api/users/loginByEmail', controller.user.loginByEmail);
  // router.get('/api/users/:id', controller.user.show);
  router.get('/api/users/getUserInfo', jwtMiddleware, controller.user.show);
  router.post('/api/users/genVeriCode', controller.user.sendVeriCode);
  router.post(
    '/api/users/loginByPhoneNumber',
    controller.user.loginByCellphone
  );
  router.get('/api/users/passport/gitee', controller.user.oauth);
  router.get(
    '/api/users/passport/gitee/callback',
    controller.user.oauthByGitee
  );

  router.post('/api/works', jwtMiddleware, controller.work.createWork);
  router.get('/api/worksQuery', jwtMiddleware, controller.work.myList);
  router.get('/api/templates', controller.work.templateList);
  router.patch('/api/works/:id', jwtMiddleware, controller.work.update);
  router.delete('/api/works/:id', jwtMiddleware, controller.work.delete);
  router.post(
    '/api/works/publish/:id',
    jwtMiddleware,
    controller.work.publishWork
  );
  router.post(
    '/api/works/publish-template/:id',
    jwtMiddleware,
    controller.work.publishTemplate
  );
  // router.post('/api/utils/upload', controller.utils.fileLocalUpload);
};
