export type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

export const ALL_BLOOD_TYPES: BloodType[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export type BloodInventory = {
  [key in BloodType]: number;
};

export type BloodBank = {
  id: string;
  name: string;
  location: string;
  distance: string;
  inventory: BloodInventory;
  coordinates: {
    lat: number;
    lng: number;
  }
};

export type UrgentRequest = {
    id: string;
    bloodType: BloodType;
    location: string;
    time: string;
    status: 'Pending' | 'Fulfilled' | 'In Progress'
};

export type AdminStat = {
    title: string;
    value: string;
    change?: string;
    changeType?: 'increase' | 'decrease';
    icon: React.ElementType;
    href?: string;
}