import { Controller } from 'egg';
import { GlobalErrorTypes } from '../error';
// 创建工厂函数
export default function validateInput(rules: any, errorType: GlobalErrorTypes) {
  return function (_prototype, _key: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const that = this as Controller;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const { ctx, app } = that;
      const errors = app.validator.validate(rules, ctx.request.body);
      if (errors) {
        return ctx.helper.error({ ctx, errorType, error: errors });
      }
      return originalMethod.apply(this, args);
    };
  };
}
