import mongoose from 'mongoose';

export async function applySmartIdField(
  schema: mongoose.Schema,
  modelName: string,
  idField: string = 'id',
) {
  const path = schema.path(idField);
  const type = path?.instance;

  if (type === 'String') {
    schema.pre('validate', function (next) {
      try {
        if (this[idField] != null) return next();

        this[idField] =
          this._id?.toString() || new mongoose.Types.ObjectId().toString();
        next();
      } catch (err) {
        console.error(
          `❌ Error assigning custom string ID for model '${modelName}':`,
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
