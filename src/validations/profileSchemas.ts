import { z } from 'zod';

export const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères')
    .max(30, 'Le nom d\'utilisateur ne doit pas dépasser 30 caractères')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores'
    ),
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide'),
  currentPassword: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 8, {
      message: 'Le mot de passe actuel doit contenir au moins 8 caractères',
    }),
  newPassword: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 8, {
      message: 'Le nouveau mot de passe doit contenir au moins 8 caractères',
    })
    .refine(
      (val) =>
        !val ||
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(val),
      {
        message:
          'Le nouveau mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
      }
    ),
  confirmNewPassword: z.string().optional(),
  bio: z
    .string()
    .max(500, 'La bio ne doit pas dépasser 500 caractères')
    .optional(),
  language: z.enum(['fr', 'en']),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    sound: z.boolean(),
  }),
}).refine(
  (data) => {
    if (data.newPassword && !data.currentPassword) {
      return false;
    }
    return true;
  },
  {
    message: 'Le mot de passe actuel est requis pour changer de mot de passe',
    path: ['currentPassword'],
  }
).refine(
  (data) => {
    if (data.newPassword && data.newPassword !== data.confirmNewPassword) {
      return false;
    }
    return true;
  },
  {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmNewPassword'],
  }
);

export type ProfileFormData = z.infer<typeof profileSchema>;
