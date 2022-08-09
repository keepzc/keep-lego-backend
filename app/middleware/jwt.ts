import { Context, EggAppConfig, Application } from 'egg';
function getTokenValue(ctx: Context) {
  // JWT格式 Header
  // Authorization Bearer tokenxxx
  const { authorization } = ctx.header;
  // 没有header 返回false
  if (!ctx.header || !authorization) {
    return false;
  }
  if (typeof authorization === 'string') {
    const parts = authorization.trim().split(' ');
    if (parts.length === 2) {
      const schema = parts[0];
      const credentials = parts[1];
      if (/^Bearer$/i.test(schema)) {
        return credentials;
      }
      return false;
    }
  } else {
    return false;
  }
}

export default (options: EggAppConfig['jwt'], app: Application) => {
  return async (ctx: Context, next: () => Promise<any>) => {
    //从header 获取对应的token
    const token = getTokenValue(ctx);
    if (!token) {
      return ctx.helper.error({ ctx, errorType: 'loginValidateFail' });
    }
    //判断secret 是否存在
    const { secret } = options;
    if (!secret) {
      throw new Error('secret not provided');
    }
    try {
      const decoded = app.jwt.verify(token, secret);
      ctx.state.user = decoded;
      await next();
    } catch (error) {
      return ctx.helper.error({ ctx, errorType: 'loginValidateFail' });
    }
  };
};
