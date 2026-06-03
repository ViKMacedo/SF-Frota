export interface Driver {
  id: string;
  name: string;
  pin: string;
  role: "admin" | "driver";
  active: boolean;
  createdAt: string;
}
