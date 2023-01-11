import { Controller } from 'egg';
import { PopulateOptions } from 'mongoose';
import { nanoid } from 'nanoid';
import inputValidate from '../decorator/inputValidate';
import checkPermission from '../decorator/checkPermission';
const workCreateRules = {
  title: 'string'
};
const channelCreateRules = {
  name: 'string',
  workId: 'number'
};
export interface IndexCondition {
  pageIndex?: number;
  pageSize?: number;
  select?: string | string[];
  // mongoose5
  // populate?: { path?: string; select?: string } | string;
  // mongoose6.5 populate
  populate?: PopulateOptions | (PopulateOptions | string)[];
  customSort?: Record<string, any>;
  find?: Record<string, any>;
}
export default class WorkController extends Controller {
  @inputValidate(channelCreateRules, 'channelValidateFail')
  @checkPermission(
    { casl: 'Channel', mongoose: 'Work' },
    'workNoPermissonFail',
    { value: { type: 'body', valueKey: 'workId' } }
  )
  async createChannel() {
    const { ctx } = this;
    const { name, workId } = ctx.request.body;
    const newChannel = { name, id: nanoid(6) };
    const res = await ctx.model.Work.findOneAndUpdate(
      { id: workId },
      { $push: { channels: newChannel } }
    );
    if (res) {
      ctx.helper.success({ ctx, res: newChannel });
    } else {
      ctx.helper.error({ ctx, errorType: 'channelOperateFail' });
    }
  }
  @checkPermission({ casl: 'Channel', mongoose: 'Work' }, 'workNoPermissonFail')
  async getWorkChannel() {
    const { ctx } = this;
    const { id } = ctx.params;
    const certianWork = await ctx.model.Work.findOne({ id });
    if (certianWork) {
      const { channels } = certianWork;
      ctx.helper.success({
        ctx,
        res: {
          count: (channels && channels.length) || 0,
          list: channels || []
        }
      });
    } else {
      ctx.helper.error({ ctx, errorType: 'channelOperateFail' });
    }
  }
  // 更新渠道
  @checkPermission(
    { casl: 'Channel', mongoose: 'Work' },
    'workNoPermissonFail',
    { key: 'channels.id' }
  )
  async updateChannelName() {
    const { ctx } = this;
    const { id } = ctx.params;
    const { name } = ctx.request.body;
    await ctx.model.Work.findOneAndUpdate(
      { 'channels.id': id },
      { $set: { 'channels.$.name': name } }
    );
    ctx.helper.success({ ctx, res: { name } });
  }
  // 删除渠道
  @checkPermission(
    { casl: 'Channel', mongoose: 'Work' },
    'workNoPermissonFail',
    { key: 'channels.id' }
  )
  async deleteChannel() {
    const { ctx } = this;
    const { id } = ctx.params;
    const work = await ctx.model.Work.findOneAndUpdate(
      { 'channels.id': id },
      {
        $pull: { channels: { id } }
      },
      { new: true }
    );
    ctx.helper.success({ ctx, res: { work } });
  }
  // 创建作品
  @inputValidate(workCreateRules, 'workValidateFail')
  @checkPermission('Work', 'workNoPermissonFail')
  async createWork() {
    const { ctx, service } = this;
    const workData = await service.work.createEmptyWork(ctx.request.body);
    ctx.helper.success({ ctx, res: workData });
  }
  async copyWork() {
    const { ctx } = this
    const { id } = ctx.params
    try {
      const res = await ctx.service.work.copyWork(parseInt(id))
      ctx.helper.success({ ctx, res })
    } catch (e) {
      return ctx.helper.error({ ctx, errorType: 'workNoPublicFail' })
    }
  }
  async template() {
    const { ctx } = this
    const { id } = ctx.params
    const res = await this.ctx.model.Work.findOne({id}).lean()
    ctx.helper.success({ ctx, res})
  }
  // 获取作品列表
  async myList() {
    const { ctx } = this;
    const userId = ctx.state.user._id;
    const { pageIndex, pageSize, isTemplate, title } = ctx.request.query;
    const findCondition = {
      user: userId,
      ...(title && { title: { $regex: title, $options: 'i' } }),
      ...(isTemplate && { isTemplate: !!parseInt(isTemplate) })
    };
    const listCondition: IndexCondition = {
      select: 'id author copiedCount coverImg desc title user isHot createdAt',
      populate: { path: 'user', select: 'username nickName picture' },
      find: findCondition,
      ...(pageIndex && { pageIndex: parseInt(pageIndex) }),
      ...(pageSize && { pageSize: parseInt(pageSize) })
    };

    const res = await ctx.service.work.getList(listCondition);
    ctx.helper.success({ ctx, res });
  }
  // 获取单个作品
  @checkPermission('Work', 'workNoPermissonFail')
  async myWork() {
    const { ctx } = this;
    const { id } = ctx.params;
    const res = await this.ctx.model.Work.findOne({ id }).lean();
    ctx.helper.success({ ctx, res });
  }
  async templateList() {
    const { ctx } = this;
    const { pageIndex, pageSize } = ctx.request.query;
    const listCondition: IndexCondition = {
      select: 'id author copiedCount coverImg desc title user isHot createdAt',
      populate: { path: 'user', select: 'username nickName picture' },
      find: { isPublic: true, isTemplate: true },
      ...(pageIndex && { pageIndex: parseInt(pageIndex) }),
      ...(pageSize && { pageSize: parseInt(pageSize) })
    };
    const res = await ctx.service.work.getList(listCondition);
    ctx.helper.success({ ctx, res });
  }
  @checkPermission('Work', 'workNoPermissonFail')
  async update() {
    const { ctx } = this;
    const { id } = ctx.params;
    const payload = ctx.request.body;
    const res = await ctx.model.Work.findOneAndUpdate({ id }, payload, {
      new: true
    });
    ctx.helper.success({ ctx, res });
  }

  @checkPermission('Work', 'workNoPermissonFail')
  async delete() {
    const { ctx } = this;
    const { id } = ctx.params;
    const res = await ctx.model.Work.findOneAndDelete({ id })
      .select('_id id title')
      .lean();
    ctx.helper.success({ ctx, res });
  }
  @checkPermission('Work', 'workNoPermissonFail', { action: 'publish' })
  async publish(isTemplate: boolean) {
    const { ctx, service } = this;
    const url = await service.work.publish(ctx.params.id, isTemplate);
    ctx.helper.success({ ctx, res: { url } });
  }
  async publishWork() {
    await this.publish(false);
  }
  async publishTemplate() {
    await this.publish(true);
  }
}
