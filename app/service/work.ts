import { Service } from 'egg';
import { nanoid } from 'nanoid';
import { Types } from 'mongoose';
import { WorkProps } from '../model/work';
import { IndexCondition } from '../controller/work';
const defaultIndexCondition: Required<IndexCondition> = {
  pageIndex: 0,
  pageSize: 10,
  select: '',
  populate: [''],
  customSort: { createdAt: -1 },
  find: {}
};
export default class UserService extends Service {
  async createEmptyWork(payload) {
    const { ctx } = this;
    // 拿到对应的 user id
    const { username, _id } = ctx.state.user;
    console.log(username, _id);
    // 拿到一个独一无二的uuid
    const uuid = nanoid(6);
    const newEmptyWork: Partial<WorkProps> = {
      ...payload,
      user: new Types.ObjectId(_id),
      author: username,
      isTemplate: false,
      uuid
    };
    return ctx.model.Work.create(newEmptyWork);
  }
  async copyWork(wid: number) {
    const { ctx } = this
    const copiedWork = await this.ctx.model.Work.findOne({ id: wid })
    if (!copiedWork || !copiedWork.isPublic) {
      throw new Error('can not be copied')
    }
    const uuid = nanoid(6)
    const { content, title, desc, coverImg, id, copiedCount } = copiedWork
    const { _id, username } = ctx.state.user
    const newWork: WorkProps = {
      user: _id,
      author: username,
      uuid,
      coverImg,
      copiedCount: 0,
      status: 1,
      title: `${title}-复制`,
      desc,
      content,
      isTemplate: false
    }
    const res = await ctx.model.Work.create(newWork)
    await ctx.model.Work.findOneAndUpdate({ id }, {
      copiedCount: copiedCount + 1,
    })
    return res
  }

  async getList(condition: IndexCondition) {
    const { ctx } = this;
    const fcondition = { ...defaultIndexCondition, ...condition };
    const { pageIndex, pageSize, select, populate, customSort, find } =
      fcondition;
    // const skip = (pageIndex - 1) * pageSize;
    const skip = pageIndex * pageSize;
    const res = await ctx.model.Work.find(find)
      .select(select)
      .populate(populate)
      .skip(skip)
      .limit(pageSize)
      .sort(customSort)
      .lean();
    const count = await ctx.model.Work.find(find).count();
    return { count, list: res, pageSize, pageIndex };
  }

  async publish(id: number, isTemplate = false) {
    const { ctx } = this;
    const { H5BaseURL } = ctx.app.config;
    const payload: Partial<WorkProps> = {
      status: 2,
      latestPublishAt: new Date(),
      ...(isTemplate && { isTemplate: true })
    };
    const res = await ctx.model.Work.findOneAndUpdate({ id }, payload, {
      new: true
    });
    const uuid = res?.uuid;
    return `${H5BaseURL}/p/${id}-${uuid}`;
  }
}
