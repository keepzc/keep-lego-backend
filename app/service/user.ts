import { Service } from 'egg';
import { UserProps } from '../model/user';

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
    console.log(userCreateData, '0000++');
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
}
