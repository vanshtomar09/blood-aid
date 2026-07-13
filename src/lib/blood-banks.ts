import type { BloodBank } from './types';

// TODO: Replace this mock data with a real API call to the e-RaktKosh platform.
const MOCK_BLOOD_BANKS: BloodBank[] = [
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
        id: '5',
        name: 'Narayana Hrudayalaya Blood Bank',
        location: 'Bommasandra, Bangalore',
        distance: '25 km',
        inventory: {
          'A+': 45, 'A-': 18, 'B+': 33, 'B-': 11, 'AB+': 7, 'AB-': 3, 'O+': 60, 'O-': 22,
        },
        coordinates: { lat: 12.8156, lng: 77.6806 }
    },
    {
        id: '6',
        name: 'Tata Memorial Hospital Blood Bank',
        location: 'Parel, Mumbai',
        distance: '18 km',
        inventory: {
          'A+': 55, 'A-': 22, 'B+': 45, 'B-': 15, 'AB+': 12, 'AB-': 4, 'O+': 75, 'O-': 30,
        },
        coordinates: { lat: 19.0064, lng: 72.8431 }
    },
    {
        id: '7',
        name: 'AIIMS Blood Bank',
        location: 'Ansari Nagar, New Delhi',
        distance: '3 km',
        inventory: {
          'A+': 70, 'A-': 30, 'B+': 50, 'B-': 20, 'AB+': 15, 'AB-': 6, 'O+': 90, 'O-': 40,
        },
        coordinates: { lat: 28.5676, lng: 77.2122 }
    },
    {
        id: '8',
        name: 'CMC Hospital Blood Bank',
        location: 'Vellore, Tamil Nadu',
        distance: '140 km',
        inventory: {
          'A+': 40, 'A-': 16, 'B+': 30, 'B-': 10, 'AB+': 8, 'AB-': 4, 'O+': 55, 'O-': 25,
        },
        coordinates: { lat: 12.9209, lng: 79.1333 }
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
  

/**
 * Fetches blood bank data. 
 * In the future, this function will be updated to fetch data from the e-RaktKosh platform.
 * @returns A promise that resolves to an array of blood banks.
 */
export async function getBloodBanks(): Promise<BloodBank[]> {
    // For now, we're returning mock data.
    // Replace this with your actual API call to e-RaktKosh.
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(MOCK_BLOOD_BANKS);
        }, 500); // Simulate network delay
    });
}
