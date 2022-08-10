import { Controller } from 'egg';
const userCreateRules = {
  username: 'email',
  password: { type: 'password', min: 8 },
};
const sendCodeRules = {
  phoneNumber: {
    type: 'string',
    format: /^1[3-9]\d{9}$/,
    message: '手机号码格式错误',
  },
};
// const userPhoneCreateRules = {
//   phoneNumber: {
//     type: 'string',
//     format: /^1[3-9]\d{9}$/,
//     message: '手机号码格式错误',
//   },
//   veriCode: { type: 'string', format: /^\d{4}$/, message: '验证码格式错误' },
// };
export const userErrorMessages = {
  userValidateFail: {
    errno: 101001,
    message: '输入信息验证错误',
  },
  //创建用户，写入数据失败
  createUserAlreadyExists: {
    errno: 101002,
    message: '该邮箱已经被创建,请直接登录',
  },
  //用户不存在或者密码错误
  loginCheckFailInfo: {
    errno: 101003,
    message: '该用户不存在或者密码错误',
  },
  loginValidateFail: {
    errno: 101004,
    message: '登录校验失败',
  },
  // 发送短信验证码过于频繁
  sendVeriCodeFrequentlyFailInfo: {
    errno: 101005,
    message: '请勿频繁获取短信验证码',
  },
  // 登录时，验证码不正确
  loginVeriCodeIncorrectFailInfo: {
    errno: 101006,
    message: '验证码不正确',
  },
  //gitee 授权错误
  giteeOauthError: {
    rrno: 101007,
    message: 'gitee 授权错误',
  },
};
export default class UserController extends Controller {
  async createByEmail() {
    const { ctx, service } = this;
    const errors = this.validateUserInput(userCreateRules);
    if (errors) {
      return ctx.helper.error({
        ctx,
        errorType: 'userValidateFail',
        error: errors,
      });
    }
    const { username } = ctx.request.body;

    const user = await service.user.findByUserName(username);

    if (user) {
      return ctx.helper.error({
        ctx,
        errorType: 'createUserAlreadyExists',
      });
    }
    const userData = await service.user.createByEmail(ctx.request.body);
    ctx.helper.success({ ctx, res: userData });
  }

  async loginByEmail() {
    const { ctx, service, app } = this;
    //检查用户输入
    const errors = this.validateUserInput(userCreateRules);
    if (errors) {
      return ctx.helper.error({
        ctx,
        errorType: 'userValidateFail',
        error: errors,
      });
    }
    //根据username取得用户信息
    const { username, password } = ctx.request.body;
    const user = await service.user.findByUserName(username);
    //检查用户是否存在
    if (!user) {
      return ctx.helper.error({ ctx, errorType: 'loginCheckFailInfo' });
    }
    const verifyPwd = await ctx.compare(password, user.password);
    //检查密码是否正确
    if (!verifyPwd) {
      return ctx.helper.error({ ctx, errorType: 'loginCheckFailInfo' });
    }
    const token = app.jwt.sign(
      { username: user.username },
      app.config.jwt.secret,
      {
        expiresIn: 60 * 60,
      }
    );
    ctx.helper.success({ ctx, res: token, msg: '登录成功' });
  }
  validateUserInput(rules: any) {
    const { ctx, app } = this;
    const errors = app.validator.validate(rules, ctx.request.body);
    ctx.logger.warn(errors);
    return errors;
  }
  // 手机登录
  async loginByCellphone() {
    const { ctx, app } = this;
    const { phoneNumber, veriCode } = ctx.request.body;
    // 检查用户输入
    const error = this.validateUserInput(sendCodeRules);
    if (error) {
      return ctx.helper.error({ ctx, errorType: 'userValidateFail', error });
    }
    // 传入验证码是否正确
    const preVeriCode = await app.redis.get(`phoneVeriCode-${phoneNumber}`);
    // 判断是否存在
    if (veriCode !== preVeriCode) {
      return ctx.helper.error({
        ctx,
        errorType: 'loginVeriCodeIncorrectFailInfo',
      });
    }
    const token = await this.service.user.loginByCellphone(phoneNumber);
    ctx.helper.success({ ctx, res: { token } });
  }
  async sendVeriCode() {
    const { ctx, app } = this;
    const { phoneNumber } = ctx.request.body;
    // 检查用户输入
    const error = this.validateUserInput(sendCodeRules);
    if (error) {
      return ctx.helper.error({ ctx, errorType: 'userValidateFail', error });
    }
    // 获取redis数据
    const preVeriCode = await app.redis.get(`phoneVeriCode-${phoneNumber}`);
    // 判断是否存在
    if (preVeriCode) {
      return ctx.helper.error({
        ctx,
        errorType: 'sendVeriCodeFrequentlyFailInfo',
      });
    }
    //
    const veriCode = Math.floor(Math.random() * 9000 + 1000).toString();
    await app.redis.set(`phoneVeriCode-${phoneNumber}`, veriCode, 'ex', 60);
    ctx.helper.success({ ctx, res: { veriCode } });
  }
  async show() {
    const { ctx } = this;
    // const token = this.getTokenValue();
    // if (!token) {
    //   return ctx.helper.error({ ctx, errorType: 'loginValidateFail' });
    // }
    // try {
    //   const decoded = verify(token, app.config.secret);
    //   ctx.helper.success({ ctx, res: decoded });
    // } catch (error) {
    //   return ctx.helper.error({ ctx, errorType: 'loginValidateFail' });
    // }
    const userData = await this.service.user.findByUserName(
      ctx.state.user.username
    );
    ctx.helper.success({ ctx, res: userData?.toJSON() });
  }

  async oauth() {
    const { app, ctx } = this;
    const { cid, redirectURL } = app.config.giteeOauthConfig;
    ctx.redirect(
      `https://gitee.com/oauth/authorize?client_id=${cid}&redirect_uri=${redirectURL}&response_type=code`
    );
  }

  async oauthByGitee() {
    const { ctx } = this;
    const { code } = ctx.request.query;
    try {
      const token = await ctx.service.user.loginByGitee(code);
      ctx.helper.success({ ctx, res: { token } });
    } catch (error) {
      return ctx.helper.error({ ctx, errorType: 'giteeOauthError' });
    }
  }
}
