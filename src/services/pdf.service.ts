/**
 * PDF Export Service
 *
 * Generates professional PDF exports of recipes using expo-print.
 * Supports custom branding, formatting, and sharing.
 *
 * @module services/pdf
 */

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import type { Recipe, RecipeIngredient, RecipeStep } from "@/types/database";

interface PDFOptions {
  /** Include recipe image in PDF */
  includeImage?: boolean;
  /** Include nutrition information */
  includeNutrition?: boolean;
  /** Custom notes to append */
  notes?: string;
}

/**
 * Generate HTML template for recipe PDF
 */
function generateRecipeHTML(recipe: Recipe, options: PDFOptions = {}): string {
  const { includeImage = true, includeNutrition = true, notes } = options;

  // Format ingredients
  const ingredientsHTML = recipe.ingredients
    .map(
      (ing: RecipeIngredient) =>
        `<li>${ing.quantity || ""} ${ing.unit || ""} ${ing.name}</li>`
    )
    .join("");

  // Format steps
  const stepsHTML = recipe.steps
    .map((step: RecipeStep) => `<li>${step.instruction}</li>`)
    .join("");

  // Format nutrition
  let nutritionHTML = "";
  if (includeNutrition && recipe.nutrition?.perServing) {
    const { perServing } = recipe.nutrition;
    nutritionHTML = `
      <div class="nutrition">
        <h2>Informations Nutritionnelles</h2>
        <p class="nutrition-subtitle">Par portion</p>
        <div class="nutrition-grid">
          <div class="nutrition-item">
            <span class="nutrition-label">Calories</span>
            <span class="nutrition-value">${Math.round(perServing.calories || 0)} kcal</span>
          </div>
          <div class="nutrition-item">
            <span class="nutrition-label">Protéines</span>
            <span class="nutrition-value">${(perServing.protein || 0).toFixed(1)} g</span>
          </div>
          <div class="nutrition-item">
            <span class="nutrition-label">Glucides</span>
            <span class="nutrition-value">${(perServing.carbohydrates || 0).toFixed(1)} g</span>
          </div>
          <div class="nutrition-item">
            <span class="nutrition-label">Lipides</span>
            <span class="nutrition-value">${(perServing.fat || 0).toFixed(1)} g</span>
          </div>
          <div class="nutrition-item">
            <span class="nutrition-label">Fibres</span>
            <span class="nutrition-value">${(perServing.fiber || 0).toFixed(1)} g</span>
          </div>
          <div class="nutrition-item">
            <span class="nutrition-label">Sucres</span>
            <span class="nutrition-value">${(perServing.sugar || 0).toFixed(1)} g</span>
          </div>
        </div>
      </div>
    `;
  }

  // Format times
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
  };

  const prepTimeHTML = recipe.prepTime
    ? `<span class="meta-item">⏱️ Préparation: ${formatTime(recipe.prepTime)}</span>`
    : "";
  const cookTimeHTML = recipe.cookTime
    ? `<span class="meta-item">🔥 Cuisson: ${formatTime(recipe.cookTime)}</span>`
    : "";
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  const totalTimeHTML =
    totalTime > 0 ? `<span class="meta-item">⏲️ Total: ${formatTime(totalTime)}</span>` : "";

  const difficultyLabels: Record<string, string> = {
    easy: "Facile",
    medium: "Moyen",
    hard: "Difficile",
  };
  const difficultyHTML = recipe.difficulty
    ? `<span class="meta-item">👨‍🍳 ${difficultyLabels[recipe.difficulty] || recipe.difficulty}</span>`
    : "";

  // Image HTML
  const imageHTML =
    includeImage && recipe.imageUrl
      ? `<img src="${recipe.imageUrl}" alt="${recipe.title}" class="recipe-image" />`
      : "";

  // Notes HTML
  const notesHTML = notes
    ? `
      <div class="notes">
        <h2>Notes</h2>
        <p>${notes}</p>
      </div>
    `
    : "";

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${recipe.title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #2C2416;
          line-height: 1.6;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }

        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 30px;
          border-bottom: 3px solid #FFB03A;
        }

        .recipe-image {
          width: 100%;
          max-height: 400px;
          object-fit: cover;
          border-radius: 12px;
          margin-bottom: 30px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        h1 {
          font-size: 42px;
          color: #6B5847;
          margin-bottom: 20px;
          font-weight: 700;
        }

        .description {
          font-size: 16px;
          color: #8B7355;
          margin-bottom: 30px;
          line-height: 1.8;
        }

        .metadata {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          justify-content: center;
          margin-bottom: 20px;
        }

        .meta-item {
          background: #FFF9F0;
          padding: 10px 20px;
          border-radius: 20px;
          font-size: 14px;
          color: #6B5847;
          border: 1px solid #FFE8C6;
        }

        h2 {
          font-size: 28px;
          color: #6B5847;
          margin: 40px 0 20px 0;
          padding-bottom: 10px;
          border-bottom: 2px solid #FFE8C6;
          font-weight: 600;
        }

        .section {
          margin-bottom: 40px;
        }

        ul {
          list-style: none;
          padding: 0;
        }

        li {
          padding: 12px 0;
          border-bottom: 1px solid #F5F0E8;
          font-size: 16px;
        }

        li:last-child {
          border-bottom: none;
        }

        .ingredients ul {
          display: grid;
          grid-template-columns: 1fr 1fr;
          column-gap: 30px;
        }

        .ingredients li::before {
          content: "🥄 ";
          margin-right: 10px;
        }

        .steps li {
          counter-increment: step-counter;
          padding-left: 40px;
          position: relative;
        }

        .steps {
          counter-reset: step-counter;
        }

        .steps li::before {
          content: counter(step-counter);
          position: absolute;
          left: 0;
          top: 12px;
          background: #FFB03A;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
        }

        .nutrition {
          background: #FFF9F0;
          padding: 30px;
          border-radius: 12px;
          margin: 40px 0;
          border: 2px solid #FFE8C6;
        }

        .nutrition-subtitle {
          color: #8B7355;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .nutrition-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .nutrition-item {
          text-align: center;
          padding: 15px;
          background: white;
          border-radius: 8px;
          border: 1px solid #FFE8C6;
        }

        .nutrition-label {
          display: block;
          font-size: 12px;
          color: #8B7355;
          margin-bottom: 5px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .nutrition-value {
          display: block;
          font-size: 20px;
          font-weight: 600;
          color: #6B5847;
        }

        .notes {
          background: #FFF9F0;
          padding: 20px;
          border-radius: 8px;
          margin-top: 30px;
          border-left: 4px solid #FFB03A;
        }

        .notes p {
          color: #6B5847;
          line-height: 1.8;
        }

        .footer {
          text-align: center;
          margin-top: 60px;
          padding-top: 30px;
          border-top: 2px solid #FFE8C6;
          color: #8B7355;
          font-size: 14px;
        }

        .footer-brand {
          font-weight: 600;
          color: #FFB03A;
        }

        @media print {
          body {
            padding: 20px;
          }

          .recipe-image {
            page-break-after: avoid;
          }

          h2 {
            page-break-after: avoid;
          }

          li {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${recipe.title}</h1>
        ${recipe.description ? `<p class="description">${recipe.description}</p>` : ""}
        <div class="metadata">
          <span class="meta-item">🍽️ ${recipe.servings} portion${recipe.servings > 1 ? "s" : ""}</span>
          ${prepTimeHTML}
          ${cookTimeHTML}
          ${totalTimeHTML}
          ${difficultyHTML}
        </div>
      </div>

      ${imageHTML}

      <div class="section ingredients">
        <h2>Ingrédients</h2>
        <ul>
          ${ingredientsHTML}
        </ul>
      </div>

      <div class="section steps">
        <h2>Préparation</h2>
        <ul>
          ${stepsHTML}
        </ul>
      </div>

      ${nutritionHTML}
      ${notesHTML}

      <div class="footer">
        Généré avec <span class="footer-brand">Paprika</span> 🍳
      </div>
    </body>
    </html>
  `;
}

/**
 * Export recipe to PDF and share
 */
export async function exportRecipeToPDF(
  recipe: Recipe,
  options: PDFOptions = {}
): Promise<void> {
  try {
    // Generate HTML
    const html = generateRecipeHTML(recipe, options);

    // Generate PDF
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // Share PDF
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: `${recipe.title}.pdf`,
        UTI: "com.adobe.pdf",
      });
    } else {
      throw new Error("Le partage n'est pas disponible sur cet appareil");
    }
  } catch (error) {
    console.error("Error exporting PDF:", error);
    throw error;
  }
}

/**
 * Print recipe directly (iOS/Android native print dialog)
 */
export async function printRecipe(
  recipe: Recipe,
  options: PDFOptions = {}
): Promise<void> {
  try {
    const html = generateRecipeHTML(recipe, options);
    await Print.printAsync({ html });
  } catch (error) {
    console.error("Error printing recipe:", error);
    throw error;
  }
}
