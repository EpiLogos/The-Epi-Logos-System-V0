export interface SubsystemFeature {
  id: string;
  coordinate: string;
  name: string;
  icon: string;
  leftFeature: {
    label: string;
    route?: string;
    comingSoon: boolean;
  };
  rightFeature: {
    label: string;
    route?: string;
    comingSoon: boolean;
  };
}

export const subsystemFeatures: SubsystemFeature[] = [
  {
    id: '0',
    coordinate: '#0',
    name: 'Anuttara',
    icon: '/ui-system/anuttara-icon.png',
    leftFeature: {
      label: 'Coming soon',
      comingSoon: true,
    },
    rightFeature: {
      label: 'Coming soon',
      comingSoon: true,
    },
  },
  {
    id: '1',
    coordinate: '#1',
    name: 'Paramasiva',
    icon: '/ui-system/paramasiva-icon.png',
    leftFeature: {
      label: 'Coming soon',
      comingSoon: true,
    },
    rightFeature: {
      label: 'Coming soon',
      comingSoon: true,
    },
  },
  {
    id: '2',
    coordinate: '#2',
    name: 'Parashakti',
    icon: '/ui-system/parashakti-icon.png',
    leftFeature: {
      label: 'Coming soon',
      comingSoon: true,
    },
    rightFeature: {
      label: 'Coming soon',
      comingSoon: true,
    },
  },
  {
    id: '3',
    coordinate: '#3',
    name: 'Mahamaya',
    icon: '/ui-system/mahamaya-icon.png',
    leftFeature: {
      label: 'Coming soon',
      comingSoon: true,
    },
    rightFeature: {
      label: 'Coming soon',
      comingSoon: true,
    },
  },
  {
    id: '4',
    coordinate: '#4',
    name: 'Nara',
    icon: '/ui-system/nara-icon.png',
    leftFeature: {
      label: 'Journal',
      route: '/nara/journal',
      comingSoon: false,
    },
    rightFeature: {
      label: 'Pratibimba',
      route: '/nara/pratibimba',
      comingSoon: false,
    },
  },
  {
    id: '5',
    coordinate: '#5',
    name: 'Epii',
    icon: '/ui-system/epii-icon.png',
    leftFeature: {
      label: 'Etymology',
      route: '/epii/etymology',
      comingSoon: false,
    },
    rightFeature: {
      label: 'Bimba Explorer',
      route: '/epii/bimba-explorer',
      comingSoon: false,
    },
  },
];
