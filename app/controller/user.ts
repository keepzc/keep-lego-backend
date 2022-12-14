import { Controller } from 'egg';
import inputValidate from '../decorator/inputValidate';
const userCreateRules = {
  username: 'email',
  password: { type: 'password', min: 8 }
};
const sendCodeRules = {
  phoneNumber: {
    type: 'string',
    format: /^1[3-9]\d{9}$/,
    message: '手机号码格式错误'
  }
};
// const userPhoneCreateRules = {
//   phoneNumber: {
//     type: 'string',
//     format: /^1[3-9]\d{9}$/,
//     message: '手机号码格式错误',
//   },
//   veriCode: { type: 'string', format: /^\d{4}$/, message: '验证码格式错误' },
// };

export default class UserController extends Controller {
  @inputValidate(userCreateRules, 'userValidateFail')
  async createByEmail() {
    const { ctx, service } = this;
    const { username } = ctx.request.body;

    const user = await service.user.findByUserName(username);

    if (user) {
      return ctx.helper.error({
        ctx,
        errorType: 'createUserAlreadyExists'
      });
    }
    const userData = await service.user.createByEmail(ctx.request.body);
    ctx.helper.success({ ctx, res: userData });
  }
  @inputValidate(userCreateRules, 'userValidateFail')
  async loginByEmail() {
    const { ctx, service, app } = this;
    // 根据username取得用户信息
    const { username, password } = ctx.request.body;
    const user = await service.user.findByUserName(username);
    // 检查用户是否存在
    if (!user) {
      return ctx.helper.error({ ctx, errorType: 'loginCheckFailInfo' });
    }
    const verifyPwd = await ctx.compare(password, user.password);
    // 检查密码是否正确
    if (!verifyPwd) {
      return ctx.helper.error({ ctx, errorType: 'loginCheckFailInfo' });
    }
    const token = app.jwt.sign(
      { username: user.username, _id: user._id },
      app.config.jwt.secret,
      {
        expiresIn: 60 * 60
      }
    );
    ctx.helper.success({ ctx, res: token, msg: '登录成功' });
  }
  // 手机登录
  @inputValidate(sendCodeRules, 'userValidateFail')
  async loginByCellphone() {
    const { ctx, app } = this;
    const { phoneNumber, veriCode } = ctx.request.body;
    // 传入验证码是否正确
    const preVeriCode = await app.redis.get(`phoneVeriCode-${phoneNumber}`);
    // 判断是否存在
    if (veriCode !== preVeriCode) {
      return ctx.helper.error({
        ctx,
        errorType: 'loginVeriCodeIncorrectFailInfo'
      });
    }
    const token = await this.service.user.loginByCellphone(phoneNumber);
    ctx.helper.success({ ctx, res: { token } });
  }
  @inputValidate(sendCodeRules, 'userValidateFail')
  async sendVeriCode() {
    const { ctx, app } = this;
    const { phoneNumber } = ctx.request.body;
    // 获取redis数据
    const preVeriCode = await app.redis.get(`phoneVeriCode-${phoneNumber}`);
    // 判断是否存在
    if (preVeriCode) {
      return ctx.helper.error({
        ctx,
        errorType: 'sendVeriCodeFrequentlyFailInfo'
      });
    }
    // 由于短信服务没有审批通过 暂时使用6666
    // const veriCode = Math.floor(Math.random() * 9000 + 1000).toString();
    const veriCode = '6666'
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

  // 通过Gitee登录
  async oauthByGitee() {
    const { ctx } = this;
    const { code } = ctx.request.query;
    try {
      const token = await ctx.service.user.loginByGitee(code);
      await ctx.render('success.nj', { token });
      // ctx.helper.success({ ctx, res: { token } });
    } catch (error) {
      return ctx.helper.error({ ctx, errorType: 'giteeOauthError' });
    }
  }
}
