import { Service } from 'egg';
import { nanoid } from 'nanoid';
import { Types } from 'mongoose';
import { WorkProps } from '../model/work';

export default class UserService extends Service {
  async createEmptyWork(payload) {
    const { ctx } = this;
    //拿到对应的 user id
    const { username, _id } = ctx.state.user;
    console.log(username, _id);
    //拿到一个独一无二的uuid
    const uuid = nanoid(6);
    const newEmptyWork: Partial<WorkProps> = {
      ...payload,
      user: new Types.ObjectId(_id),
      author: username,
      uuid,
    };
    return ctx.model.Work.create(newEmptyWork);
  }
}
