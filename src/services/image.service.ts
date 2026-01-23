/**
 * Image Service
 *
 * Handles image search and storage for ingredients and recipes:
 * 1. Search TheMealDB for normalized ingredient photos (white background)
 * 2. Upload and store images in Supabase Storage
 * 3. Generate image URLs for database storage
 *
 * @module services/image
 */

import { supabase } from "@/lib/supabase";
import type {
  IngredientImageResult,
  IngredientImageOptions,
  ServiceResponse,
} from "@/types/ai";
import {
  cleanIngredientName,
  removeAccents,
  generateVariations,
} from "@/utils/ingredientNormalizer";

/**
 * TheMealDB base URL for ingredient images
 * Format: https://www.themealdb.com/images/ingredients/{Name}-Small.png
 * Using -Small suffix for transparent background images
 */
const THEMEALDB_IMAGE_BASE_URL =
  "https://www.themealdb.com/images/ingredients";

/**
 * Supabase Storage bucket for images
 */
const STORAGE_BUCKET = "recipe-images";

/**
 * French to English ingredient mapping dictionary
 * Expanded from ~150 to ~400 entries for better coverage
 */
const FRENCH_TO_ENGLISH: Record<string, string> = {
  // ==========================================================================
  // VEGETABLES (Légumes)
  // ==========================================================================
  tomate: "Tomato",
  tomates: "Tomato",
  "tomates cerises": "Cherry Tomatoes",
  "tomate cerise": "Cherry Tomatoes",
  oignon: "Onion",
  oignons: "Onion",
  "oignon rouge": "Red Onion",
  "oignons rouges": "Red Onion",
  "oignon jaune": "Onion",
  "oignon blanc": "Onion",
  ail: "Garlic",
  "gousse d'ail": "Garlic",
  "gousses d'ail": "Garlic",
  carotte: "Carrot",
  carottes: "Carrot",
  pomme: "Apple",
  pommes: "Apple",
  "pomme de terre": "Potatoes",
  "pommes de terre": "Potatoes",
  patate: "Potatoes",
  patates: "Potatoes",
  "patate douce": "Sweet Potatoes",
  "patates douces": "Sweet Potatoes",
  courgette: "Courgettes",
  courgettes: "Courgettes",
  aubergine: "Aubergine",
  aubergines: "Aubergine",
  poivron: "Pepper",
  poivrons: "Pepper",
  "poivron rouge": "Red Pepper",
  "poivron vert": "Green Pepper",
  "poivron jaune": "Yellow Pepper",
  champignon: "Mushrooms",
  champignons: "Mushrooms",
  "champignon de paris": "Mushrooms",
  "champignons de paris": "Mushrooms",
  shiitake: "Shiitake Mushrooms",
  shiitakes: "Shiitake Mushrooms",
  épinard: "Spinach",
  épinards: "Spinach",
  epinard: "Spinach",
  epinards: "Spinach",
  salade: "Lettuce",
  laitue: "Lettuce",
  roquette: "Rocket",
  concombre: "Cucumber",
  brocoli: "Broccoli",
  brocolis: "Broccoli",
  chou: "Cabbage",
  "chou vert": "Cabbage",
  "chou rouge": "Red Cabbage",
  "chou blanc": "Cabbage",
  "chou chinois": "Chinese Cabbage",
  "chou-fleur": "Cauliflower",
  "chou fleur": "Cauliflower",
  choufleur: "Cauliflower",
  "chou kale": "Kale",
  kale: "Kale",
  "chou frisé": "Kale",
  haricot: "Broad Beans",
  haricots: "Broad Beans",
  "haricots verts": "Green Beans",
  "haricot vert": "Green Beans",
  "haricots blancs": "Cannellini Beans",
  "haricots rouges": "Red Kidney Beans",
  pois: "Peas",
  "petits pois": "Peas",
  "pois chiches": "Chickpeas",
  "pois chiche": "Chickpeas",
  radis: "Radish",
  navet: "Turnip",
  navets: "Turnip",
  betterave: "Beetroot",
  betteraves: "Beetroot",
  céleri: "Celery",
  celeri: "Celery",
  "branche de céleri": "Celery",
  "céleri branche": "Celery",
  poireau: "Leek",
  poireaux: "Leek",
  asperge: "Asparagus",
  asperges: "Asparagus",
  artichaut: "Artichoke",
  artichauts: "Artichoke",
  fenouil: "Fennel",
  butternut: "Butternut Squash",
  "courge butternut": "Butternut Squash",
  courge: "Squash",
  "courge musquée": "Butternut Squash",
  citrouille: "Pumpkin",
  potiron: "Pumpkin",
  potimarron: "Pumpkin",
  lentille: "Lentils",
  lentilles: "Lentils",
  "lentilles vertes": "Lentils",
  "lentilles corail": "Red Lentils",
  "lentilles rouges": "Red Lentils",
  maïs: "Sweetcorn",
  mais: "Sweetcorn",
  "épi de maïs": "Sweetcorn",
  "germes de soja": "Beansprouts",
  soja: "Beansprouts",
  échalote: "Shallots",
  échalotes: "Shallots",
  echalote: "Shallots",
  echalotes: "Shallots",
  échalotte: "Shallots",
  echalotte: "Shallots",
  echalottes: "Shallots",
  "oignon nouveau": "Spring Onion",
  "oignons nouveaux": "Spring Onion",
  "oignon vert": "Spring Onion",
  ciboule: "Spring Onion",
  ciboulette: "Chives",

  // ==========================================================================
  // HERBS & AROMATICS (Herbes et Aromates)
  // ==========================================================================
  basilic: "Basil",
  persil: "Parsley",
  "persil plat": "Parsley",
  "persil frisé": "Parsley",
  thym: "Thyme",
  "thym frais": "Thyme",
  romarin: "Rosemary",
  "romarin frais": "Rosemary",
  origan: "Oregano",
  coriandre: "Coriander",
  "coriandre fraîche": "Coriander",
  "feuilles de coriandre": "Coriander Leaves",
  menthe: "Mint",
  "menthe fraîche": "Mint",
  "feuilles de menthe": "Mint",
  laurier: "Bay Leaf",
  "feuille de laurier": "Bay Leaf",
  "feuilles de laurier": "Bay Leaves",
  aneth: "Dill",
  estragon: "Tarragon",
  sauge: "Sage",
  marjolaine: "Marjoram",
  cerfeuil: "Chervil",
  citronelle: "Lemongrass",
  citronnelle: "Lemongrass",
  citronelles: "Lemongrass",
  citronnelles: "Lemongrass",
  "baton de citronelle": "Lemongrass",
  "batons de citronelle": "Lemongrass",
  "bâton de citronnelle": "Lemongrass",
  "bâtons de citronnelle": "Lemongrass",
  gingembre: "Ginger",
  "gingembre frais": "Ginger",
  galanga: "Galangal",
  "feuilles de combava": "Kaffir Lime Leaves",
  "feuille de combava": "Kaffir Lime Leaves",
  combava: "Kaffir Lime Leaves",

  // ==========================================================================
  // SPICES (Épices)
  // ==========================================================================
  sel: "Salt",
  "sel fin": "Salt",
  "gros sel": "Sea Salt",
  "fleur de sel": "Sea Salt",
  poivre: "Pepper",
  "poivre noir": "Black Pepper",
  "poivre blanc": "Pepper",
  paprika: "Paprika",
  "paprika fumé": "Smoked Paprika",
  "paprika doux": "Paprika",
  cumin: "Cumin",
  "cumin moulu": "Cumin",
  "graines de cumin": "Cumin Seeds",
  curry: "Curry Powder",
  "poudre de curry": "Curry Powder",
  cannelle: "Cinnamon",
  "bâton de cannelle": "Cinnamon",
  "cannelle moulue": "Cinnamon",
  muscade: "Nutmeg",
  "noix de muscade": "Nutmeg",
  piment: "Chilli",
  "piment rouge": "Red Chilli",
  "piment vert": "Green Chilli",
  "piment d'espelette": "Chilli Powder",
  "piment de cayenne": "Cayenne Pepper",
  cayenne: "Cayenne Pepper",
  "flocons de piment": "Chilli Flakes",
  "poudre de chili": "Chilli Powder",
  curcuma: "Turmeric",
  safran: "Saffron",
  cardamome: "Cardamom",
  "anis étoilé": "Star Anise",
  badiane: "Star Anise",
  "clou de girofle": "Cloves",
  "clous de girofle": "Cloves",
  girofle: "Cloves",
  "graines de coriandre": "Coriander Seeds",
  fenugrec: "Fenugreek",
  "garam masala": "Garam Masala",
  "5 épices": "Five Spice",
  "cinq épices": "Five Spice",
  "quatre épices": "Allspice",
  sumac: "Sumac",
  "ras el hanout": "Ras el Hanout",
  harissa: "Harissa Spice",
  zaatar: "Za'atar",
  "za'atar": "Za'atar",

  // ==========================================================================
  // MEATS (Viandes)
  // ==========================================================================
  poulet: "Chicken",
  "poulet entier": "Whole Chicken",
  boeuf: "Beef",
  bœuf: "Beef",
  porc: "Pork",
  agneau: "Lamb",
  veau: "Veal",
  bacon: "Bacon",
  lardons: "Bacon",
  lardon: "Bacon",
  pancetta: "Pancetta",
  jambon: "Ham",
  "jambon cru": "Parma Ham",
  "jambon de parme": "Parma Ham",
  "jambon blanc": "Ham",
  saucisse: "Sausages",
  saucisses: "Sausages",
  chorizo: "Chorizo",
  merguez: "Chorizo",
  "blanc de poulet": "Chicken Breast",
  "blancs de poulet": "Chicken Breast",
  "filet de poulet": "Chicken Breast",
  "filets de poulet": "Chicken Breast",
  "escalope de poulet": "Chicken Breast",
  "escalopes de poulet": "Chicken Breast",
  "poitrine de poulet": "Chicken Breast",
  "cuisse de poulet": "Chicken Thighs",
  "cuisses de poulet": "Chicken Thighs",
  "haut de cuisse": "Chicken Thighs",
  "hauts de cuisse": "Chicken Thighs",
  "pilon de poulet": "Chicken Legs",
  "pilons de poulet": "Chicken Legs",
  "aile de poulet": "Chicken Wings",
  "ailes de poulet": "Chicken Wings",
  dinde: "Turkey",
  "filet de dinde": "Turkey Breast",
  "escalope de dinde": "Turkey Breast",
  canard: "Duck",
  "magret de canard": "Duck",
  "cuisse de canard": "Duck Legs",
  lapin: "Rabbit",
  "viande hachée": "Minced Beef",
  "boeuf haché": "Minced Beef",
  "porc haché": "Minced Pork",
  "steak": "Steak",
  "steak haché": "Minced Beef",
  "côte de boeuf": "Beef Brisket",
  "côtes de porc": "Pork Chops",
  "côtelette": "Pork Chops",
  "côtelettes": "Pork Chops",
  "filet mignon": "Pork Fillet",
  "rôti de porc": "Pork",
  "rôti de boeuf": "Beef",
  "poitrine de porc": "Pork Belly",

  // ==========================================================================
  // SEAFOOD (Fruits de mer)
  // ==========================================================================
  saumon: "Salmon",
  "filet de saumon": "Salmon",
  "pavé de saumon": "Salmon",
  "saumon fumé": "Smoked Salmon",
  thon: "Tuna",
  "thon en boîte": "Tinned Tuna",
  crevette: "Prawns",
  crevettes: "Prawns",
  "crevettes tigrées": "Tiger Prawns",
  "crevettes roses": "Prawns",
  gambas: "King Prawns",
  moule: "Mussels",
  moules: "Mussels",
  calamar: "Squid",
  calamars: "Squid",
  encornet: "Squid",
  poulpe: "Octopus",
  cabillaud: "Cod",
  "filet de cabillaud": "Cod",
  "dos de cabillaud": "Cod",
  colin: "Cod",
  lieu: "Pollack",
  truite: "Trout",
  "truite fumée": "Smoked Trout",
  anchois: "Anchovies",
  sardine: "Sardines",
  sardines: "Sardines",
  maquereau: "Mackerel",
  "saint-jacques": "Scallops",
  "noix de saint-jacques": "Scallops",
  coquille: "Scallops",
  coquilles: "Scallops",
  homard: "Lobster",
  crabe: "Crab",
  "chair de crabe": "Crab",
  langouste: "Langoustine",
  langoustine: "Langoustine",
  langoustines: "Langoustine",
  palourde: "Clams",
  palourdes: "Clams",
  huître: "Oysters",
  huîtres: "Oysters",
  "poisson blanc": "White Fish",

  // ==========================================================================
  // DAIRY (Produits laitiers)
  // ==========================================================================
  lait: "Milk",
  "lait entier": "Milk",
  "lait demi-écrémé": "Semi Skimmed Milk",
  "lait écrémé": "Milk",
  beurre: "Butter",
  "beurre doux": "Butter",
  "beurre salé": "Butter",
  "beurre demi-sel": "Butter",
  fromage: "Cheese",
  crème: "Cream",
  "crème fraîche": "Creme Fraiche",
  "crème liquide": "Double Cream",
  "crème épaisse": "Sour Cream",
  "crème fouettée": "Double Cream",
  yaourt: "Yogurt",
  yogourt: "Yogurt",
  "yaourt grec": "Greek Yogurt",
  "fromage blanc": "Quark",
  mascarpone: "Mascarpone",
  ricotta: "Ricotta",
  parmesan: "Parmesan",
  "parmesan râpé": "Parmesan",
  mozzarella: "Mozzarella",
  gruyère: "Gruyere",
  gruyere: "Gruyere",
  emmental: "Swiss Cheese",
  comté: "Gruyere",
  comte: "Gruyere",
  cheddar: "Cheddar Cheese",
  feta: "Feta",
  "fromage de chèvre": "Goats Cheese",
  "chèvre frais": "Goats Cheese",
  chevre: "Goats Cheese",
  roquefort: "Blue Cheese",
  "fromage bleu": "Blue Cheese",
  gorgonzola: "Gorgonzola",
  brie: "Brie",
  camembert: "Camembert",
  halloumi: "Halloumi",
  "crème de coco": "Coconut Cream",
  "lait de coco": "Coconut Milk",
  "lait d'amande": "Almond Milk",
  "lait de soja": "Soya Milk",

  // ==========================================================================
  // GRAINS & PASTA (Céréales et Pâtes)
  // ==========================================================================
  riz: "Rice",
  "riz basmati": "Basmati Rice",
  "riz jasmin": "Jasmine Rice",
  "riz long": "Long Grain Rice",
  "riz arborio": "Arborio Rice",
  "riz à risotto": "Arborio Rice",
  "riz complet": "Brown Rice",
  "riz brun": "Brown Rice",
  pâte: "Pasta",
  pâtes: "Pasta",
  pate: "Pasta",
  pates: "Pasta",
  spaghetti: "Spaghetti",
  spaghettis: "Spaghetti",
  tagliatelle: "Tagliatelle",
  tagliatelles: "Tagliatelle",
  penne: "Penne",
  fusilli: "Fusilli",
  farfalle: "Farfalle",
  rigatoni: "Rigatoni",
  linguine: "Linguine",
  linguini: "Linguine",
  macaroni: "Macaroni",
  lasagne: "Lasagne Sheets",
  "feuilles de lasagne": "Lasagne Sheets",
  gnocchi: "Gnocchi",
  nouille: "Noodles",
  nouilles: "Noodles",
  "nouilles de riz": "Rice Noodles",
  "nouilles chinoises": "Noodles",
  "nouilles soba": "Noodles",
  udon: "Udon Noodles",
  ramen: "Noodles",
  vermicelle: "Vermicelli",
  vermicelles: "Vermicelli",
  farine: "Plain Flour",
  "farine de blé": "Plain Flour",
  "farine blanche": "Plain Flour",
  "farine complète": "Wholemeal Bread",
  "farine t45": "Plain Flour",
  "farine t55": "Plain Flour",
  semoule: "Semolina",
  maïzena: "Corn Flour",
  "fécule de maïs": "Corn Flour",
  "fécule de pomme de terre": "Potato Starch",
  pain: "Bread",
  "pain de mie": "White Bread",
  "pain complet": "Wholemeal Bread",
  baguette: "Bread",
  chapelure: "Breadcrumbs",
  "pain rassis": "Breadcrumbs",
  quinoa: "Quinoa",
  boulgour: "Bulgur Wheat",
  bulgur: "Bulgur Wheat",
  couscous: "Couscous",
  orge: "Pearl Barley",
  "orge perlé": "Pearl Barley",
  avoine: "Oats",
  "flocons d'avoine": "Rolled Oats",

  // ==========================================================================
  // FRUITS
  // ==========================================================================
  citron: "Lemon",
  citrons: "Lemon",
  "jus de citron": "Lemon Juice",
  "zeste de citron": "Lemon Zest",
  "citron vert": "Lime",
  "citrons verts": "Lime",
  lime: "Lime",
  "jus de citron vert": "Lime Juice",
  orange: "Orange",
  oranges: "Orange",
  "jus d'orange": "Orange Juice",
  "zeste d'orange": "Orange Zest",
  pamplemousse: "Grapefruit",
  banane: "Banana",
  bananes: "Banana",
  fraise: "Strawberries",
  fraises: "Strawberries",
  framboise: "Raspberries",
  framboises: "Raspberries",
  myrtille: "Blueberries",
  myrtilles: "Blueberries",
  mûre: "Blackberries",
  mûres: "Blackberries",
  cerise: "Cherries",
  cerises: "Cherries",
  pêche: "Peach",
  pêches: "Peach",
  peche: "Peach",
  abricot: "Apricots",
  abricots: "Apricots",
  prune: "Plums",
  prunes: "Plums",
  raisin: "Grapes",
  raisins: "Grapes",
  "raisins secs": "Raisins",
  "raisin sec": "Raisins",
  ananas: "Pineapple",
  mangue: "Mango",
  mangues: "Mango",
  papaye: "Papaya",
  kiwi: "Kiwi",
  avocat: "Avocado",
  avocats: "Avocado",
  poire: "Pear",
  poires: "Pear",
  melon: "Melon",
  "melon d'eau": "Watermelon",
  pastèque: "Watermelon",
  grenade: "Pomegranate",
  figue: "Figs",
  figues: "Figs",
  datte: "Dates",
  dattes: "Dates",
  "fruits rouges": "Mixed Berries",
  "fruits de la passion": "Passion Fruit",

  // ==========================================================================
  // NUTS & SEEDS (Noix et Graines)
  // ==========================================================================
  amande: "Almonds",
  amandes: "Almonds",
  "amandes effilées": "Flaked Almonds",
  "poudre d'amande": "Ground Almonds",
  noix: "Walnuts",
  "noix de cajou": "Cashew Nuts",
  "noix de coco": "Desiccated Coconut",
  "noix de coco râpée": "Desiccated Coconut",
  noisette: "Hazelnuts",
  noisettes: "Hazelnuts",
  pistache: "Pistachios",
  pistaches: "Pistachios",
  cacahuète: "Peanuts",
  cacahuètes: "Peanuts",
  "beurre de cacahuète": "Peanut Butter",
  "pignon de pin": "Pine Nuts",
  "pignons de pin": "Pine Nuts",
  pignon: "Pine Nuts",
  pécan: "Pecan Nuts",
  "noix de pécan": "Pecan Nuts",
  macadamia: "Macadamia Nuts",
  "graine de sésame": "Sesame Seeds",
  "graines de sésame": "Sesame Seeds",
  sésame: "Sesame Seeds",
  "graine de tournesol": "Sunflower Seeds",
  "graines de tournesol": "Sunflower Seeds",
  "graine de courge": "Pumpkin Seeds",
  "graines de courge": "Pumpkin Seeds",
  "graine de lin": "Flax Seeds",
  "graines de lin": "Flax Seeds",
  "graine de chia": "Chia Seeds",
  "graines de chia": "Chia Seeds",
  "graine de pavot": "Poppy Seeds",
  "graines de pavot": "Poppy Seeds",

  // ==========================================================================
  // CONDIMENTS & SAUCES
  // ==========================================================================
  "huile d'olive": "Olive Oil",
  "huile olive": "Olive Oil",
  huile: "Vegetable Oil",
  "huile végétale": "Vegetable Oil",
  "huile de tournesol": "Sunflower Oil",
  "huile de colza": "Rapeseed Oil",
  "huile de sésame": "Sesame Oil",
  "huile de coco": "Coconut Oil",
  vinaigre: "Vinegar",
  "vinaigre balsamique": "Balsamic Vinegar",
  "vinaigre de cidre": "Apple Cider Vinegar",
  "vinaigre de vin": "Red Wine Vinegar",
  "vinaigre de riz": "Rice Vinegar",
  moutarde: "Mustard",
  "moutarde de dijon": "Dijon Mustard",
  "moutarde à l'ancienne": "Wholegrain Mustard",
  mayonnaise: "Mayonnaise",
  ketchup: "Tomato Ketchup",
  miel: "Honey",
  "sirop d'érable": "Maple Syrup",
  "sirop d'agave": "Agave Syrup",
  "sauce soja": "Soy Sauce",
  "sauce soya": "Soy Sauce",
  "sauce soja claire": "Light Soy Sauce",
  "sauce soja foncée": "Dark Soy Sauce",
  tamari: "Soy Sauce",
  "sauce d'huître": "Oyster Sauce",
  "sauce huitre": "Oyster Sauce",
  "sauce huître": "Oyster Sauce",
  "nuoc mam": "Fish Sauce",
  "sauce nuoc mam": "Fish Sauce",
  "sauce poisson": "Fish Sauce",
  "sauce worcestershire": "Worcestershire Sauce",
  "sauce worcester": "Worcestershire Sauce",
  "pâte de curry rouge": "Thai Red Curry Paste",
  "pâte de curry vert": "Thai Green Curry Paste",
  "pâte de curry jaune": "Thai Green Curry Paste",
  "pâte de curry": "Curry Paste",
  "concentré de tomate": "Tomato Puree",
  "purée de tomate": "Tomato Puree",
  "double concentré": "Tomato Puree",
  "coulis de tomate": "Passata",
  passata: "Passata",
  "tomates pelées": "Chopped Tomatoes",
  "tomates concassées": "Chopped Tomatoes",
  "tomates en boîte": "Chopped Tomatoes",
  "sauce tomate": "Tomato Ketchup",
  tahini: "Tahini",
  tahin: "Tahini",
  "pâte de sésame": "Tahini",
  houmous: "Houmous",
  hummus: "Houmous",
  pesto: "Pesto",
  tapenade: "Tapenade",
  "câpres": "Capers",
  capres: "Capers",
  cornichon: "Gherkin",
  cornichons: "Gherkin",
  olive: "Olives",
  olives: "Olives",
  "olives noires": "Black Olives",
  "olives vertes": "Green Olives",

  // ==========================================================================
  // EGGS & OTHERS
  // ==========================================================================
  oeuf: "Eggs",
  oeufs: "Eggs",
  œuf: "Eggs",
  œufs: "Eggs",
  "jaune d'oeuf": "Egg Yolks",
  "jaunes d'oeufs": "Egg Yolks",
  "blanc d'oeuf": "Egg White",
  "blancs d'oeufs": "Egg White",
  tofu: "Tofu",
  "tofu ferme": "Tofu",
  "tofu soyeux": "Silken Tofu",
  tempeh: "Tempeh",
  seitan: "Seitan",

  // ==========================================================================
  // BAKING & SWEETS (Pâtisserie)
  // ==========================================================================
  sucre: "Sugar",
  "sucre blanc": "Caster Sugar",
  "sucre en poudre": "Caster Sugar",
  "sucre semoule": "Caster Sugar",
  "sucre roux": "Brown Sugar",
  "sucre brun": "Brown Sugar",
  cassonade: "Brown Sugar",
  "sucre glace": "Icing Sugar",
  "sucre vanillé": "Vanilla Sugar",
  chocolat: "Chocolate",
  "chocolat noir": "Dark Chocolate",
  "chocolat au lait": "Milk Chocolate",
  "chocolat blanc": "White Chocolate",
  "pépites de chocolat": "Chocolate Chips",
  cacao: "Cocoa",
  "poudre de cacao": "Cocoa",
  vanille: "Vanilla",
  "extrait de vanille": "Vanilla Extract",
  "gousse de vanille": "Vanilla",
  "levure chimique": "Baking Powder",
  "levure boulangère": "Yeast",
  levure: "Yeast",
  "bicarbonate de soude": "Bicarbonate of Soda",
  "bicarbonate": "Bicarbonate of Soda",
  gélatine: "Gelatine",
  "feuille de gélatine": "Gelatine Leaves",
  "pâte feuilletée": "Puff Pastry",
  "pâte brisée": "Shortcrust Pastry",
  "pâte sablée": "Shortcrust Pastry",
  "pâte filo": "Filo Pastry",
  "pâte à pizza": "Pizza Dough",
  confiture: "Jam",
  "confiture de fraise": "Strawberry Jam",
  "confiture d'abricot": "Apricot Jam",
  marmelade: "Marmalade",
  "pâte à tartiner": "Nutella",
  nutella: "Nutella",

  // ==========================================================================
  // BEVERAGES & LIQUIDS
  // ==========================================================================
  eau: "Water",
  "bouillon de poulet": "Chicken Stock",
  "bouillon de légumes": "Vegetable Stock",
  "bouillon de boeuf": "Beef Stock",
  bouillon: "Vegetable Stock",
  "fond de veau": "Beef Stock",
  "fond de volaille": "Chicken Stock",
  "vin blanc": "White Wine",
  "vin rouge": "Red Wine",
  vin: "White Wine",
  "vinaigre de vin blanc": "White Wine Vinegar",
  "vinaigre de vin rouge": "Red Wine Vinegar",
  bière: "Stout",
  cidre: "Cider",
  cognac: "Brandy",
  rhum: "Dark Rum",
  whisky: "Whiskey",
  "jus de pomme": "Apple Juice",
  café: "Coffee",
  "café soluble": "Instant Coffee",
  thé: "Tea",
};

/**
 * ImageService
 *
 * Main service for searching and managing recipe/ingredient images.
 * Uses multi-strategy lookup with caching for optimal performance.
 */
export class ImageService {
  // In-memory cache for ingredient images (persists during app session)
  private static imageCache: Map<string, string | null> = new Map();

  /**
   * Search for an ingredient image on TheMealDB
   * Uses multi-strategy approach for better success rate
   *
   * @param options - Image search options
   * @returns Promise resolving to image result
   *
   * @example
   * ```typescript
   * const result = await ImageService.searchIngredientImage({
   *   ingredientName: "2 batons de citronelles"
   * });
   *
   * if (result.success) {
   *   console.log("Image URL:", result.imageUrl);
   * }
   * ```
   */
  static async searchIngredientImage(
    options: IngredientImageOptions
  ): Promise<IngredientImageResult> {
    const { ingredientName } = options;

    try {
      // Step 1: Clean the ingredient name (remove quantities, units, etc.)
      const cleanedName = cleanIngredientName(ingredientName);
      const cacheKey = cleanedName.toLowerCase();

      // Step 2: Check cache first
      if (this.imageCache.has(cacheKey)) {
        const cachedUrl = this.imageCache.get(cacheKey);
        if (cachedUrl) {
          return { success: true, imageUrl: cachedUrl, source: "cache" as const };
        }
        return {
          success: false,
          error: `No image found for "${ingredientName}" (cached)`,
        };
      }

      // Step 3: Try direct dictionary lookup
      const directMatch = this.lookupDictionary(cleanedName);
      if (directMatch) {
        const result = await this.tryImageUrl(directMatch);
        if (result) {
          this.imageCache.set(cacheKey, result.imageUrl!);
          return result;
        }
      }

      // Step 4: Try without accents
      const noAccentName = removeAccents(cleanedName);
      if (noAccentName !== cleanedName) {
        const noAccentMatch = this.lookupDictionary(noAccentName);
        if (noAccentMatch && noAccentMatch !== directMatch) {
          const result = await this.tryImageUrl(noAccentMatch);
          if (result) {
            this.imageCache.set(cacheKey, result.imageUrl!);
            return result;
          }
        }
      }

      // Step 5: Try variations (singular/plural)
      const variations = generateVariations(cleanedName);
      for (const variation of variations) {
        if (variation === cleanedName) continue;
        const varMatch = this.lookupDictionary(variation);
        if (varMatch) {
          const result = await this.tryImageUrl(varMatch);
          if (result) {
            this.imageCache.set(cacheKey, result.imageUrl!);
            return result;
          }
        }
      }

      // Step 6: Try capitalized name directly (for English ingredients)
      const capitalizedName = this.capitalizeWords(cleanedName);
      const directResult = await this.tryImageUrl(capitalizedName);
      if (directResult) {
        this.imageCache.set(cacheKey, directResult.imageUrl!);
        return directResult;
      }

      // Step 7: Try without accents capitalized
      if (noAccentName !== cleanedName) {
        const capitalizedNoAccent = this.capitalizeWords(noAccentName);
        if (capitalizedNoAccent !== capitalizedName) {
          const noAccentResult = await this.tryImageUrl(capitalizedNoAccent);
          if (noAccentResult) {
            this.imageCache.set(cacheKey, noAccentResult.imageUrl!);
            return noAccentResult;
          }
        }
      }

      // Cache as null to avoid repeated lookups
      this.imageCache.set(cacheKey, null);

      return {
        success: false,
        error: `No image found for "${ingredientName}" on TheMealDB`,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? `Image search failed: ${error.message}`
            : "Image search failed",
      };
    }
  }

  /**
   * Search and cache images for multiple ingredients
   * Optimized with deduplication and caching
   *
   * @param ingredientNames - Array of ingredient names
   * @returns Promise resolving to map of ingredient → image URL
   */
  static async batchSearchIngredientImages(
    ingredientNames: string[]
  ): Promise<Record<string, string>> {
    const imageMap: Record<string, string> = {};

    // Deduplicate by cleaned name to avoid redundant lookups
    const nameToOriginals = new Map<string, string[]>();
    for (const name of ingredientNames) {
      const cleaned = cleanIngredientName(name).toLowerCase();
      if (!nameToOriginals.has(cleaned)) {
        nameToOriginals.set(cleaned, []);
      }
      nameToOriginals.get(cleaned)!.push(name);
    }

    // Process unique cleaned names
    for (const [, originals] of nameToOriginals) {
      const result = await this.searchIngredientImage({
        ingredientName: originals[0],
      });

      // Map result to all original names
      if (result.success && result.imageUrl) {
        for (const original of originals) {
          imageMap[original] = result.imageUrl;
        }
      }

      // Small delay to avoid overwhelming the server (reduced since we cache)
      await this.delay(30);
    }

    return imageMap;
  }

  /**
   * Lookup ingredient in French→English dictionary
   */
  private static lookupDictionary(name: string): string | null {
    const lowerName = name.toLowerCase().trim();
    return FRENCH_TO_ENGLISH[lowerName] ?? null;
  }

  /**
   * Try to fetch an image URL from TheMealDB
   * Returns null if image doesn't exist
   */
  private static async tryImageUrl(
    englishName: string
  ): Promise<IngredientImageResult | null> {
    // Use -Small suffix for transparent background images
    const imageUrl = `${THEMEALDB_IMAGE_BASE_URL}/${encodeURIComponent(englishName)}-Small.png`;

    try {
      const response = await fetch(imageUrl, { method: "HEAD" });
      if (response.ok) {
        return {
          success: true,
          imageUrl,
          source: "themealdb",
        };
      }
    } catch {
      // Ignore fetch errors
    }

    return null;
  }

  /**
   * Capitalize first letter of each word
   */
  private static capitalizeWords(name: string): string {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  /**
   * Upload image to Supabase Storage
   *
   * @param file - File or Blob to upload
   * @param path - Storage path (e.g., "recipes/abc123.jpg")
   * @returns Promise resolving to public URL
   */
  static async uploadImage(
    file: File | Blob,
    path: string
  ): Promise<ServiceResponse<string>> {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.path);

      return { data: publicUrl, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Upload failed"),
      };
    }
  }

  /**
   * Delete image from Supabase Storage
   */
  static async deleteImage(path: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([path]);

      if (error) throw error;

      return { data: undefined, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Delete failed"),
      };
    }
  }

  /**
   * Download image from URL and upload to Supabase Storage
   */
  static async downloadAndUpload(
    imageUrl: string,
    storagePath: string
  ): Promise<ServiceResponse<string>> {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const blob = await response.blob();
      return await this.uploadImage(blob, storagePath);
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error
            : new Error("Download and upload failed"),
      };
    }
  }

  /**
   * Helper to delay execution
   */
  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Initialize storage bucket if it doesn't exist
   */
  static async initializeStorage(): Promise<ServiceResponse<void>> {
    try {
      const { data: buckets, error: listError } =
        await supabase.storage.listBuckets();

      if (listError) throw listError;

      const bucketExists = buckets?.some((b) => b.name === STORAGE_BUCKET);

      if (!bucketExists) {
        const { error: createError } = await supabase.storage.createBucket(
          STORAGE_BUCKET,
          {
            public: true,
            fileSizeLimit: 5242880,
            allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
          }
        );

        if (createError) throw createError;
        console.log(`Created storage bucket: ${STORAGE_BUCKET}`);
      }

      return { data: undefined, error: null };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error
            : new Error("Storage initialization failed"),
      };
    }
  }

  /**
   * Generate optimized image URL with transformations
   */
  static getOptimizedUrl(
    publicUrl: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: "webp" | "jpeg" | "png";
    }
  ): string {
    const params = new URLSearchParams();

    if (options.width) params.append("width", options.width.toString());
    if (options.height) params.append("height", options.height.toString());
    if (options.quality) params.append("quality", options.quality.toString());
    if (options.format) params.append("format", options.format);

    return params.toString()
      ? `${publicUrl}?${params.toString()}`
      : publicUrl;
  }

  /**
   * Clear the image cache (useful for testing or forced refresh)
   */
  static clearCache(): void {
    this.imageCache.clear();
  }
}
