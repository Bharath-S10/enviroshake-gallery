export const galleryData = [
  {
    id: 1,
    src: '/assets/enviroshake-aged-cedar.webp',
    color: 'Autumn',
    roofStyle: 'Gable',
    roofDetail: ['Skylight'],
    projectType: 'Residential'
  },
  {
    id: 2,
    src: '/assets/enviroshake-aged-cedar.webp',
    color: 'Slate Black',
    roofStyle: 'Hip',
    roofDetail: ['Snow Guards'],
    projectType: 'Commercial'
  },
  {
    id: 3,
    src: '/assets/enviroshake-aged-cedar.webp',
    color: 'Canyon',
    roofStyle: 'Gambrel',
    roofDetail: ['Solar Panels'],
    projectType: 'Religious'
  },
  {
    id: 4,
    src: '/assets/enviroshake-aged-cedar.webp',
    color: 'Mountain',
    roofStyle: 'Mansard',
    roofDetail: ['Steeple'],
    projectType: 'Hospitality'
  },
  // repeat entries to exceed 24 for pagination demo
];

// duplicate sample items to produce more data
for (let i = 5; i <= 30; i++) {
  const base = galleryData[(i - 1) % 4];
  galleryData.push({
    ...base,
    id: i
  });
}
