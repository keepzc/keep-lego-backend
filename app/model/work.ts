import { Application } from 'egg';
import { ObjectId } from 'mongoose';
import AutoIncrementFactory from 'mongoose-sequence';

export interface WorkProps {
  id?: number;
  uuid: string;
  title: string;
  desc: string;
  coverImg?: string;
  content?: { [key: string]: any };
  isTemplate?: boolean;
  isPublic?: boolean;
  isHot?: boolean;
  author: string;
  copiedCount: number;
  status?: 0 | 1 | 2;
  user: ObjectId;
  latestPublishAt?: Date;
}

function initWorkModel(app: Application) {
  const AutoIncrement = AutoIncrementFactory(app.mongoose);
  const { Schema } = app.mongoose;
  const WorkSchema = new Schema<WorkProps>(
    {
      uuid: { type: String, unique: true },
      title: { type: String, required: true },
      desc: { type: String },
      coverImg: { type: String },
      content: { type: Object },
      isTemplate: { type: Boolean },
      isPublic: { type: Boolean },
      isHot: { type: Boolean },
      author: { type: String, required: true },
      copiedCount: { type: Number, default: 0 },
      status: { type: Number, default: 1 }, // 0是删除 1未发布 2发布 3管理员强制下线
      user: { type: Schema.Types.ObjectId, ref: 'User' },
      latestPublishAt: { type: Date },
    },
    { timestamps: true }
  );
  WorkSchema.plugin(AutoIncrement, { inc_field: 'id', id: 'works_id_counter' });
  return app.mongoose.model<WorkProps>('Work', WorkSchema);
}

export default initWorkModel;
