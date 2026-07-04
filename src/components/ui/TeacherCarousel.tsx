import { FlatList, StyleSheet } from 'react-native';
import { spacing } from '../../constants/theme';
import { TeacherCard, TeacherItem } from './TeacherCard';

type TeacherCarouselProps = {
  data: TeacherItem[];
};

export const TeacherCarousel = ({ data }: TeacherCarouselProps) => (
  <FlatList
    horizontal
    data={data}
    showsHorizontalScrollIndicator={false}
    keyExtractor={(item, index) => `${item.id}-${index}`}
    renderItem={({ item }) => <TeacherCard item={item} />}
    contentContainerStyle={styles.list}
  />
);

const styles = StyleSheet.create({
  list: {
    paddingRight: spacing.lg,
  },
});
