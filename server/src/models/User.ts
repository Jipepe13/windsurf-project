import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Veuillez fournir un nom d\'utilisateur'],
      unique: true,
      trim: true,
      minlength: [3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères'],
      maxlength: [20, 'Le nom d\'utilisateur ne peut pas dépasser 20 caractères'],
      validate: {
        validator: function(v: string) {
          return /^[a-zA-Z0-9_-]+$/.test(v);
        },
        message: 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores'
      }
    },
    email: {
      type: String,
      required: [true, 'Veuillez fournir une adresse email'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: [validator.isEmail, 'Veuillez fournir une adresse email valide'],
    },
    password: {
      type: String,
      required: [true, 'Veuillez fournir un mot de passe'],
      minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères'],
      validate: {
        validator: function(v: string) {
          // Au moins une majuscule, une minuscule, un chiffre et un caractère spécial
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(v);
        },
        message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'
      },
      select: false,
    },
    avatar: {
      type: String,
      default: '',
      validate: {
        validator: function(v: string) {
          return !v || validator.isURL(v);
        },
        message: 'L\'URL de l\'avatar n\'est pas valide'
      }
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour des requêtes plus rapides
userSchema.index({ email: 1, username: 1 });
userSchema.index({ isOnline: 1 });
userSchema.index({ createdAt: 1 });

// Hasher le mot de passe avant la sauvegarde
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12); // Augmentation de la sécurité
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Méthode de comparaison des mots de passe
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    if (!this.password) {
      const user = await this.model('User').findById(this._id).select('+password');
      if (!user || !user.password) return false;
      return bcrypt.compare(candidatePassword, user.password);
    }
    return bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

export default mongoose.model<IUser>('User', userSchema);
