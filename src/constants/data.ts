import { ImageSourcePropType } from 'react-native';

export type CarouselItem = {
  id: string;
  title: string;
  cta: string;
  color: string;
  image: ImageSourcePropType;
};

export type ForYouItem = {
  id: string;
  title: string;
  subtitle?: string;
  duration?: string;
  color: string;
  image?: ImageSourcePropType;
};

export type SubjectItem = {
  id: string;
  title: string;
  image: ImageSourcePropType;
};

export type VideoItem = {
  id: string;
  title: string;
  author: string;
  image: ImageSourcePropType;
};

export type PastPaperItem = {
  id: string;
  title: string;
  image: ImageSourcePropType;
  accent: string;
  tags: string[];
};

const imageImports = {
  panda: require('../../assets/images/panda.png'),
  user: require('../../assets/images/user.png'),
  avatars: require('../../assets/images/avatars.png'),
  bulb: require('../../assets/images/bulb.png'),
  brain: require('../../assets/images/brain.png'),
  math: require('../../assets/images/math.png'),
  physics: require('../../assets/images/physics.png'),
  chemistry: require('../../assets/images/chemistry.png'),
  video: require('../../assets/images/video.jpg'),
  mock: require('../../assets/images/mock.png'),
  uneb: require('../../assets/images/uneb.png'),
  bookshop: require('../../assets/images/bookshop.png'),
  footer: require('../../assets/images/footer.png'),
};

export const carouselData: CarouselItem[] = [
  {
    id: 'slide-1',
    title: 'What would you like to learn today?',
    cta: 'Get Started',
    color: '#D4EAFD',
    image: imageImports.panda,
  },
  {
    id: 'slide-2',
    title: 'Master your revision routine',
    cta: 'Explore Plans',
    color: '#E7F8EA',
    image: imageImports.panda,
  },
  {
    id: 'slide-3',
    title: 'Catch up with the best videos',
    cta: 'Watch Now',
    color: '#FCECDD',
    image: imageImports.panda,
  },
];

export const forYouData: ForYouItem[] = [
  { id: 'fy-1', title: 'Basic What is an organism', subtitle: 'Learn the fundamentals', duration: '30 min', color: '#6BCB77' },
  { id: 'fy-2', title: 'Join your class', subtitle: 'Stay engaged with peers', color: '#F4F5F7', image: imageImports.avatars },
  { id: 'fy-3', title: 'Tips for better Revision', subtitle: 'Simple study habits', color: '#B89AF8', image: imageImports.bulb },
  { id: 'fy-4', title: 'Get tips from others', subtitle: 'Grow with community', color: '#F4F5F7', image: imageImports.brain },
];

export const subjectsData: SubjectItem[] = [
  { id: 'subject-1', title: 'Math', image: imageImports.math },
  { id: 'subject-2', title: 'Physics', image: imageImports.physics },
  { id: 'subject-3', title: 'Chemistry', image: imageImports.chemistry },
];

export const videosData: VideoItem[] = [
  { id: 'video-1', title: 'Everything you need to know about Global Warming', author: 'By Rikhav Sharma', image: imageImports.video },
  { id: 'video-2', title: 'How to solve algebra faster', author: 'By Maya L.', image: imageImports.video },
  { id: 'video-3', title: 'Physics explained in 10 mins', author: 'By Noah K.', image: imageImports.video },
];

export const pastPapersData: PastPaperItem[] = [
  { id: 'paper-1', title: 'Mocks', image: imageImports.mock, accent: '#DDEBFF', tags: ['MOCKS'] },
  { id: 'paper-2', title: 'UNEB', image: imageImports.uneb, accent: '#FCECDD', tags: ['UNEB'] },
  { id: 'paper-3', title: 'Marking Guides', image: imageImports.mock, accent: '#E7F8EA', tags: ['UNEB', 'MOCKS'] },
  { id: 'paper-4', title: 'Other exam papers', image: imageImports.uneb, accent: '#F1EAFE', tags: ['MORE'] },
];
