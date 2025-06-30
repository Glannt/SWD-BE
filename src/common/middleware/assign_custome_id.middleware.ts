import mongoose from 'mongoose';

export async function applySmartIdField(
  schema: mongoose.Schema,
  modelName: string,
  idField: string = 'id',
) {
  const path = schema.path(idField);
  const type = path?.instance;

  if (type === 'String') {
    schema.pre('save', function (next) {
      try {
        // Chỉ tạo ID nếu chưa có hoặc là null/undefined
        if (
          this[idField] &&
          this[idField] !== null &&
          this[idField] !== undefined
        ) {
          return next();
        }

        // Tạo ID duy nhất dựa trên _id và timestamp
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substring(2, 8);
        const idPart = this._id
          ? this._id.toString().slice(-6)
          : new mongoose.Types.ObjectId().toString().slice(-6);

        this[idField] =
          `${modelName.toLowerCase()}_${timestamp}_${idPart}_${randomPart}`;

        console.log(
          `✅ Generated ${idField}: ${this[idField]} for ${modelName}`,
        );
        next();
      } catch (err) {
        console.error(
          `❌ Error assigning custom string ID for model '${modelName}':`,
          err,
        );
        next(err);
      }
    });

    // Thêm pre-validate hook để đảm bảo ID được tạo trước khi validate
    schema.pre('validate', function (next) {
      try {
        if (
          this[idField] &&
          this[idField] !== null &&
          this[idField] !== undefined
        ) {
          return next();
        }

        // Tạo ID nếu chưa có
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substring(2, 8);
        const idPart = this._id
          ? this._id.toString().slice(-6)
          : new mongoose.Types.ObjectId().toString().slice(-6);

        this[idField] =
          `${modelName.toLowerCase()}_${timestamp}_${idPart}_${randomPart}`;

        console.log(
          `✅ Generated ${idField} in validate: ${this[idField]} for ${modelName}`,
        );
        next();
      } catch (err) {
        console.error(
          `❌ Error assigning custom string ID in validate for model '${modelName}':`,
          err,
        );
        next(err);
      }
    });
  }

  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_, ret) => {
      ret.id = ret[idField];
      delete ret._id;
      delete ret.id;
      return ret;
    },
  });

  schema.set('toObject', {
    virtuals: true,
    versionKey: false,
    transform: (_, ret) => {
      ret.id = ret[idField];
      delete ret._id;
      delete ret.id;
      return ret;
    },
  });
}
