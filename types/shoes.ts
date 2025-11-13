type Brand =
  | "Nike"
  | "Adidas"
  | "Puma"
  | "Reebok"
  | "New Balance"
  | "Asics"
  | "Under Armour"
  | "Vans"
  | "Converse"
  | "Jordan";

type Tag = "Running" | "Casual" | "Basketball" | "Training" | "Lifestyle";

export type Shoes = {
  brand: Brand;
  model: string;
  price: number;
  tag?: Tag[];
  imageUrl?: string;
  description?: string;
  rating: number;
  likes?: number;
};
