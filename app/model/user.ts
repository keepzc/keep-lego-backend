import { Application } from 'egg';
import { Schema } from 'mongoose';
import * as AutoIncrementFactory from 'mongoose-sequence';
export interface UserProps {
  username: string;
  password: string;
  email?: string;
  nickName?: string;
  picture?: string;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

function initUserModel(app: Application) {
  const AutoIncrement = AutoIncrementFactory(app.mongoose);
  const userSchema = new Schema<UserProps>(
    {
      username: { type: String, unique: true, required: true },
      password: { type: String, required: true },
      nickName: { type: String },
      picture: { type: String },
      phoneNumber: { type: String },
    },
    {
      timestamps: true,
      toJSON: {
        transform(_doc, ret) {
          delete ret.password;
          delete ret.__v;
        },
      },
    }
  );
  userSchema.plugin(AutoIncrement, { inc_field: 'id', id: 'users_id_counter' });
  return app.mongoose.model<UserProps>('User', userSchema);
}

export default initUserModel;
