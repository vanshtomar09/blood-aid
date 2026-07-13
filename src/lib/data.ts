import type { BloodBank, UrgentRequest, AdminStat } from './types';
import { Droplet, Users, Activity, HeartPulse } from 'lucide-react';

export const bloodBanks: BloodBank[] = [
  {
    id: '1',
    name: 'Apollo Hospital Blood Bank',
    location: 'Sarita Vihar, New Delhi',
    distance: '5 km',
    inventory: {
      'A+': 35,
      'A-': 15,
      'B+': 28,
      'B-': 8,
      'AB+': 5,
      'AB-': 2,
      'O+': 50,
      'O-': 20,
    },
    coordinates: { lat: 28.5388, lng: 77.2917 }
  },
  {
    id: '2',
    name: 'Lilavati Hospital Blood Centre',
    location: 'Bandra West, Mumbai',
    distance: '12 km',
    inventory: {
      'A+': 20,
      'A-': 10,
      'B+': 15,
      'B-': 4,
      'AB+': 3,
      'AB-': 1,
      'O+': 40,
      'O-': 12,
    },
    coordinates: { lat: 19.0651, lng: 72.8315 }
  },
  {
    id: '3',
    name: 'Indian Red Cross Society',
    location: 'Koramangala, Bangalore',
    distance: '8 km',
    inventory: {
      'A+': 60,
      'A-': 25,
      'B+': 40,
      'B-': 18,
      'AB+': 10,
      'AB-': 5,
      'O+': 80,
      'O-': 35,
    },
    coordinates: { lat: 12.9351, lng: 77.6245 }
  },
  {
    id: '4',
    name: 'Fortis Malar Hospital Blood Bank',
    location: 'Adyar, Chennai',
    distance: '15 km',
    inventory: {
      'A+': 18,
      'A-': 7,
      'B+': 22,
      'B-': 9,
      'AB+': 4,
      'AB-': 2,
      'O+': 33,
      'O-': 14,
    },
    coordinates: { lat: 13.0067, lng: 80.2577 }
  },
  {
    id: '9',
    name: 'Kailash Hospital Blood Bank',
    location: 'Sector 27, Greater Noida',
    distance: '2 km',
    inventory: {
      'A+': 25, 'A-': 12, 'B+': 30, 'B-': 5, 'AB+': 8, 'AB-': 3, 'O+': 45, 'O-': 15,
    },
    coordinates: { lat: 28.4611, lng: 77.5116 }
  },
  {
    id: '10',
    name: 'Sharda Hospital Blood Centre',
    location: 'Knowledge Park III, Greater Noida',
    distance: '4 km',
    inventory: {
      'A+': 40, 'A-': 10, 'B+': 25, 'B-': 8, 'AB+': 6, 'AB-': 2, 'O+': 55, 'O-': 18,
    },
    coordinates: { lat: 28.4731, lng: 77.4831 }
  },
  {
    id: '11',
    name: 'Yatharth Super Speciality Hospital',
    location: 'Omega I, Greater Noida',
    distance: '6 km',
    inventory: {
      'A+': 15, 'A-': 5, 'B+': 20, 'B-': 4, 'AB+': 3, 'AB-': 1, 'O+': 30, 'O-': 10,
    },
    coordinates: { lat: 28.4682, lng: 77.5376 }
  },
  {
    id: '12',
    name: 'GIMS Blood Bank (Govt Hospital)',
    location: 'Kasna, Greater Noida',
    distance: '8 km',
    inventory: {
      'A+': 50, 'A-': 20, 'B+': 45, 'B-': 12, 'AB+': 15, 'AB-': 5, 'O+': 65, 'O-': 25,
    },
    coordinates: { lat: 28.4414, lng: 77.5255 }
  }
];


export const urgentRequests: UrgentRequest[] = [
    { id: 'req-1', bloodType: 'O-', location: 'Apollo Hospital', time: '2h ago', status: 'In Progress' },
    { id: 'req-2', bloodType: 'A+', location: 'Lilavati Hospital', time: '5h ago', status: 'Pending' },
    { id: 'req-3', bloodType: 'B-', location: 'Fortis Malar', time: '1d ago', status: 'Fulfilled' },
    { id: 'req-4', bloodType: 'AB+', location: 'Red Cross Bangalore', time: '2d ago', status: 'Fulfilled' },
]

export const adminStats: AdminStat[] = [
    {
        title: 'Total Units Available',
        value: '1,245',
        change: '+12.5%',
        changeType: 'increase',
        icon: Droplet
    },
    {
        title: 'Active Donors',
        value: '589',
        change: '+2.1%',
        changeType: 'increase',
        icon: Users
    },
    {
        title: 'Urgent Requests',
        value: '12',
        change: '-5.2%',
        changeType: 'decrease',
        icon: Activity
    },
    {
        title: 'Fulfilled This Month',
        value: '342',
        change: '+20.1%',
        changeType: 'increase',
        icon: HeartPulse
    },
]