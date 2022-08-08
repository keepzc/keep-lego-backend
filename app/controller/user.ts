import { Controller } from 'egg';
import { sign } from 'jsonwebtoken';
const userCreateRules = {
  username: 'email',
  password: { type: 'password', min: 8 },
};

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
};
export default class UserController extends Controller {
  async createByEmail() {
    const { ctx, service } = this;
    const errors = this.validateUserInput();
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
    console.log(userData, '0000');
    ctx.helper.success({ ctx, res: userData });
  }

  async loginByEmail() {
    const { ctx, service, app } = this;
    //检查用户输入
    const errors = this.validateUserInput();
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

    const token = sign({ username: user.username }, app.config.secret, {
      expiresIn: 60 * 60,
    });
    ctx.helper.success({ ctx, res: token, msg: '登录成功' });
  }
  validateUserInput() {
    const { ctx, app } = this;
    const errors = app.validator.validate(userCreateRules, ctx.request.body);
    ctx.logger.warn(errors);
    return errors;
  }
  async show() {
    const { ctx, service } = this;
    const userData = await service.user.findById(ctx.params.id);
    ctx.helper.success({ ctx, res: userData });
  }
}
