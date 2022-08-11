import { Controller } from 'egg';
const workCreateRules = {
  title: 'string',
};

export const workErrorMessages = {
  workValidateFail: {
    errno: 102001,
    message: '输入信息验证失败',
  },
  workNoPermissonFail: {
    errno: 102002,
    message: '没有权限完成操作',
  },
  workNoPublicFail: {
    errno: 102003,
    message: '该作品未公开，不能进行操作',
  },
};

export default class WorkController extends Controller {
  private validateUserInput(rules: any) {
    const { ctx, app } = this;
    const errors = app.validator.validate(rules, ctx.request.body);
    ctx.logger.warn(errors);
    return errors;
  }

  async createWork() {
    const { ctx, service } = this;
    const errors = this.validateUserInput(workCreateRules);
    if (errors) {
      return ctx.helper.error({
        ctx,
        errorType: 'workValidateFail',
        error: errors,
      });
    }

    const workData = await service.work.createEmptyWork(ctx.request.body);
    ctx.helper.success({ ctx, res: workData });
  }
}
