import { Application } from 'egg';

export default (app: Application) => {
  const { controller, router } = app;
  // const logger = app.middleware.myLogger({
  //   allowedMethod: ['GET'],
  // });
  // const jwt = app.middleware.jwt({
  //   secret: app.config.jwt.secret,
  // });
  router.get('/', controller.home.index);
  router.post('/api/users/create', controller.user.createByEmail);
  router.post('/api/users/loginByEmail', controller.user.loginByEmail);
  // router.get('/api/users/:id', controller.user.show);
  router.get('/api/users/getUserInfo', app.jwt as any, controller.user.show);
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
};
