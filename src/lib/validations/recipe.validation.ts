/**
 * Recipe Validation Schemas
 *
 * Zod schemas for recipe form validation.
 * Ensures data integrity before sending to backend.
 *
 * @module lib/validations/recipe
 */

import { z } from "zod";

/**
 * Ingredient validation schema
 */
export const recipeIngredientSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom de l'ingrédient est requis")
    .max(100, "Le nom ne doit pas dépasser 100 caractères"),
  quantity: z
    .number({ message: "La quantité doit être un nombre" })
    .positive("La quantité doit être positive"),
  unit: z
    .string()
    .min(1, "L'unité est requise")
    .max(20, "L'unité ne doit pas dépasser 20 caractères"),
  notes: z.string().max(200, "Les notes ne doivent pas dépasser 200 caractères").optional(),
  imageUrl: z.string().url("URL invalide").optional().or(z.literal("")),
});

/**
 * Recipe step validation schema
 */
export const recipeStepSchema = z.object({
  order: z
    .number({ message: "L'ordre doit être un nombre" })
    .int("L'ordre doit être un entier")
    .positive("L'ordre doit être positif"),
  instruction: z
    .string()
    .min(5, "L'instruction doit contenir au moins 5 caractères")
    .max(1000, "L'instruction ne doit pas dépasser 1000 caractères"),
  duration: z
    .number({ message: "La durée doit être un nombre" })
    .int("La durée doit être un entier")
    .positive("La durée doit être positive")
    .optional(),
  imageUrl: z.string().url("URL invalide").optional().or(z.literal("")),
});

/**
 * Create recipe validation schema
 */
export const createRecipeSchema = z.object({
  title: z
    .string()
    .min(1, "Le titre est requis")
    .max(200, "Le titre ne doit pas dépasser 200 caractères"),
  description: z
    .string()
    .max(1000, "La description ne doit pas dépasser 1000 caractères")
    .optional()
    .or(z.literal("")),
  cookbookId: z
    .string()
    .uuid("ID de livre invalide")
    .optional()
    .or(z.literal("")),
  coverImageUrl: z
    .string()
    .url("URL invalide")
    .optional()
    .or(z.literal("")),
  servings: z
    .number({ message: "Le nombre de portions doit être un nombre" })
    .int("Le nombre de portions doit être un entier")
    .min(1, "Au moins 1 portion requise")
    .max(50, "Maximum 50 portions"),
  prepTime: z
    .number({ message: "Le temps de préparation doit être un nombre" })
    .int("Le temps de préparation doit être un entier")
    .positive("Le temps de préparation doit être positif")
    .optional(),
  cookTime: z
    .number({ message: "Le temps de cuisson doit être un nombre" })
    .int("Le temps de cuisson doit être un entier")
    .positive("Le temps de cuisson doit être positif")
    .optional(),
  difficulty: z
    .enum(["easy", "medium", "hard"], { message: "Difficulté invalide" })
    .optional(),
  tags: z
    .array(z.string().max(30, "Un tag ne doit pas dépasser 30 caractères"))
    .max(10, "Maximum 10 tags")
    .optional(),
  ingredients: z
    .array(recipeIngredientSchema)
    .min(1, "Au moins un ingrédient est requis")
    .max(50, "Maximum 50 ingrédients"),
  steps: z
    .array(recipeStepSchema)
    .min(1, "Au moins une étape est requise")
    .max(30, "Maximum 30 étapes"),
});

/**
 * Type inference from schemas
 */
export type RecipeIngredientInput = z.infer<typeof recipeIngredientSchema>;
export type RecipeStepInput = z.infer<typeof recipeStepSchema>;
export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;

/**
 * Update recipe validation schema (all fields optional except required IDs)
 */
export const updateRecipeSchema = createRecipeSchema.partial();

export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>;
