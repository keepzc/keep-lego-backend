import { Service } from 'egg';
import { UserProps } from '../model/user';

interface GiteeUserResp {
  id: number;
  login: string;
  name: string;
  avatar_url: string;
  email: string;
}
export default class UserService extends Service {
  async createByEmail(payload: UserProps) {
    const { ctx } = this;
    const { username, password } = payload;
    const hash = await ctx.genHash(password);
    const userCreateData: Partial<UserProps> = {
      username,
      password: hash,
      email: username,
    };
    return ctx.model.User.create(userCreateData);
  }

  async findById(id: string) {
    const result = await this.ctx.model.User.findById(id);
    return result;
  }

  async findByUserName(username: string) {
    const result = await this.ctx.model.User.findOne({ username });
    return result;
  }
  async loginByCellphone(cellphone: string) {
    const { ctx, app } = this;
    const user = await this.findByUserName(cellphone);
    // 检查user是否存在
    if (user) {
      const token = await app.jwt.sign(
        { username: user.username, _id: user._id },
        app.config.jwt.secret
      );
      return token;
    }
    // 新建一个用户
    const userCreateData: Partial<UserProps> = {
      username: cellphone,
      phoneNumber: cellphone,
      nickName: `乐高${cellphone.slice(-4)}`,
      type: 'cellphone',
    };
    const newUser = await ctx.model.User.create(userCreateData);
    const token = await app.jwt.sign(
      { username: newUser.username, _id: newUser._id },
      app.config.jwt.secret
    );
    return token;
  }
  //get gitee access token
  async getAccessToken(code: string) {
    const { app, ctx } = this;
    const { cid, secret, redirectURL, authURL } = app.config.giteeOauthConfig;
    const { data } = await ctx.curl(authURL, {
      method: 'POST',
      contentType: 'json',
      dataType: 'json',
      data: {
        code,
        client_id: cid,
        redirect_uri: redirectURL,
        client_secret: secret,
      },
    });
    return data.access_token;
  }
  // get gitte user data
  async getGiteeUserData(access_token: string) {
    const { app, ctx } = this;
    const { giteeUserApi } = app.config.giteeOauthConfig;
    const { data } = await ctx.curl<GiteeUserResp>(
      `${giteeUserApi}?access_token=${access_token}`,
      {
        dataType: 'json',
      }
    );
    return data;
  }

  async loginByGitee(code: string) {
    const { ctx, app } = this;
    //获取access_token
    const access_token = await this.getAccessToken(code);
    //获取用户信息
    const user = await this.getGiteeUserData(access_token);
    //检查用户是否存在
    const { id, name, avatar_url, email } = user;
    const stringId = id.toString();
    //Gitee + id
    const existUser = await this.findByUserName(`Gitee${stringId}`);
    if (existUser) {
      const token = app.jwt.sign(
        { username: existUser.username, _id: existUser._id },
        app.config.jwt.secret
      );
      return token;
    }
    //创建Gitee用户
    const userCreateData: Partial<UserProps> = {
      oauthID: stringId,
      provider: 'gitee',
      username: `Gitee${stringId}`,
      picture: avatar_url,
      nickName: name,
      email,
      type: 'oauth',
    };

    const newUser = await ctx.model.User.create(userCreateData);
    const token = app.jwt.sign(
      { username: newUser.username, _id: newUser._id },
      app.config.jwt.secret
    );
    return token;
  }
}
